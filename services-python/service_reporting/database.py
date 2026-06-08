# Gestion de la base SQLite et des projections
import sqlite3
import os
from contextlib import contextmanager
from config import DATABASE_PATH


def init_db():
    # Initialise la base avec les tables de projections
    os.makedirs(os.path.dirname(DATABASE_PATH) if os.path.dirname(DATABASE_PATH) else ".", exist_ok=True)
    with get_connection() as conn:
        cursor = conn.cursor()

        # Projection : transactions agreges
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions_projection (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT UNIQUE,
                operator_id TEXT,
                amount REAL,
                fees REAL,
                type TEXT,
                status TEXT,
                created_at TEXT
            )
        ''')

        # Projection : prets agreges
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS loans_projection (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                loan_id TEXT UNIQUE,
                customer_id TEXT,
                operator_id TEXT,
                principal REAL,
                interest_rate REAL,
                term_months INTEGER,
                status TEXT,
                disbursed_at TEXT
            )
        ''')

        conn.commit()


@contextmanager
def get_connection():
    # Context manager pour les connexions SQLite
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
