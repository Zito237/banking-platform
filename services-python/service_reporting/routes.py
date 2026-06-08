# Endpoints REST du reporting-service
from fastapi import APIRouter, Query
from typing import Optional
import pandas as pd
from database import get_connection

router = APIRouter()


@router.get("/health")
def health_check():
    # Endpoint de sante pour Kubernetes et Eureka
    return {"status": "UP", "service": "reporting-service"}


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
