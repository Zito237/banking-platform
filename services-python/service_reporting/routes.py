# Endpoints REST du reporting-service
from fastapi import APIRouter, Query, Body
from typing import Optional, List, Dict, Any
import pandas as pd
from database import get_connection

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "UP", "service": "reporting-service"}


@router.post("/admin/backfill")
def backfill(payload: Dict[str, Any] = Body(...)):
    """
    Backfill bulk transactions and loans from Java services.
    Body: { "transactions": [...], "loans": [...] }
    """
    transactions = payload.get("transactions", [])
    loans = payload.get("loans", [])
    tx_count = 0
    loan_count = 0

    with get_connection() as conn:
        cursor = conn.cursor()
        for t in transactions:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO transactions_projection
                    (transaction_id, operator_id, amount, fees, type, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    str(t.get("id")),
                    str(t.get("operatorId") or t.get("sourceOperatorId") or ""),
                    float(t.get("amount", 0) or 0),
                    float(t.get("fees", 0) or 0),
                    str(t.get("type", "")),
                    str(t.get("status", "COMPLETED")),
                    str(t.get("createdAt", ""))
                ))
                tx_count += 1
            except Exception:
                pass

        for l in loans:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO loans_projection
                    (loan_id, customer_id, operator_id, principal, interest_rate, term_months, status, disbursed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    str(l.get("id")),
                    str(l.get("customerId") or ""),
                    str(l.get("operatorId") or ""),
                    float(l.get("principal", 0) or 0),
                    float(l.get("interestRate", 0) or 0),
                    int(l.get("termMonths", 0) or 0),
                    "ACTIVE",
                    str(l.get("disbursedAt") or "")
                ))
                loan_count += 1
            except Exception:
                pass

        conn.commit()

    return {"inserted_transactions": tx_count, "inserted_loans": loan_count}


@router.get("/reports/transactions")
def report_transactions(
    operatorId: Optional[str] = Query(None, description="Filtrer par operateur"),
    from_date: Optional[str] = Query(None, alias="from", description="Date debut (ISO 8601)"),
    to_date: Optional[str] = Query(None, alias="to", description="Date fin (ISO 8601)")
):
    # Rapport sur les transactions : volume total et nombre d'operations
    # Filtres optionnels : operateur, periode
    with get_connection() as conn:
        query = "SELECT * FROM transactions_projection WHERE 1=1"
        params = []

        if operatorId:
            query += " AND operator_id = ?"
            params.append(operatorId)
        if from_date:
            query += " AND created_at >= ?"
            params.append(from_date)
        if to_date:
            query += " AND created_at <= ?"
            params.append(to_date)

        df = pd.read_sql_query(query, conn, params=params)

    if df.empty:
        return {
            "operatorId": operatorId,
            "period": {"from": from_date, "to": to_date},
            "totalVolume": 0.0,
            "totalFees": 0.0,
            "transactionCount": 0,
            "transactionsByType": {},
            "message": "Aucune donnee disponible pour cette periode"
        }

    # Agregations avec pandas
    total_volume = float(df["amount"].sum())
    total_fees = float(df["fees"].sum())
    count = int(len(df))
    by_type = df.groupby("type")["amount"].agg(["count", "sum"]).to_dict("index")

    # Formatage propre du resultat
    transactions_by_type = {
        t: {"count": int(v["count"]), "volume": float(v["sum"])}
        for t, v in by_type.items()
    }

    return {
        "operatorId": operatorId,
        "period": {"from": from_date, "to": to_date},
        "totalVolume": round(total_volume, 2),
        "totalFees": round(total_fees, 2),
        "transactionCount": count,
        "transactionsByType": transactions_by_type
    }


@router.get("/reports/loans")
def report_loans(
    operatorId: Optional[str] = Query(None, description="Filtrer par operateur")
):
    # Rapport sur les prets : nombre approuves et montant total
    # Filtre optionnel par operateur
    with get_connection() as conn:
        query = "SELECT * FROM loans_projection WHERE status = 'ACTIVE'"
        params = []

        if operatorId:
            query += " AND operator_id = ?"
            params.append(operatorId)

        df = pd.read_sql_query(query, conn, params=params)

    if df.empty:
        return {
            "operatorId": operatorId,
            "totalApprovedLoans": 0,
            "totalPrincipal": 0.0,
            "averageInterestRate": 0.0,
            "averageTermMonths": 0,
            "message": "Aucun pret approuve trouve"
        }

    # Agregations pandas
    total_loans = int(len(df))
    total_principal = float(df["principal"].sum())
    avg_rate = float(df["interest_rate"].mean())
    avg_term = float(df["term_months"].mean())

    return {
        "operatorId": operatorId,
        "totalApprovedLoans": total_loans,
        "totalPrincipal": round(total_principal, 2),
        "averageInterestRate": round(avg_rate, 2),
        "averageTermMonths": round(avg_term, 1)
    }
