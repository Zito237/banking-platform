# Consommateur RabbitMQ : ecoute banking.events et alimente les projections
import json
import threading
import pika
from config import (
    RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASS,
    RABBITMQ_EXCHANGE, RABBITMQ_QUEUE
)
from database import get_connection


def on_transaction_completed(payload: dict):
    # Traite un evenement transaction.completed
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO transactions_projection
            (transaction_id, operator_id, amount, fees, type, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            payload.get("id"),
            payload.get("operatorId") or payload.get("operator_id"),
            payload.get("amount", 0),
            payload.get("fees", 0),
            payload.get("type"),
            payload.get("status", "COMPLETED"),
            payload.get("createdAt") or payload.get("created_at")
        ))
        conn.commit()


def on_loan_approved(payload: dict):
    # Traite un evenement loan.approved
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO loans_projection
            (loan_id, customer_id, operator_id, principal, interest_rate, term_months, status, disbursed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            payload.get("id"),
            payload.get("customerId") or payload.get("customer_id"),
            payload.get("operatorId") or payload.get("operator_id"),
            payload.get("principal", 0),
            payload.get("interestRate") or payload.get("interest_rate", 0),
            payload.get("termMonths") or payload.get("term_months", 0),
            payload.get("status", "ACTIVE"),
            payload.get("disbursedAt") or payload.get("disbursed_at")
        ))
        conn.commit()


def callback(ch, method, properties, body):
    # Callback principal appele a chaque message recu
    try:
        payload = json.loads(body.decode("utf-8"))
        routing_key = method.routing_key

        if routing_key == "transaction.completed":
            on_transaction_completed(payload)
        elif routing_key == "loan.approved":
            on_loan_approved(payload)
        else:
            print(f"[REPORTING] Cle ignoree : {routing_key}")

        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"[REPORTING] Evenement traite : {routing_key}")

    except Exception as e:
        print(f"[REPORTING] Erreur traitement message : {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consumer():
    # Demarre le consommateur RabbitMQ dans un thread separe
    def run():
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    port=RABBITMQ_PORT,
                    credentials=credentials,
                    heartbeat=600,
                    blocked_connection_timeout=300
                )
            )
            channel = connection.channel()

            # Exchange topic
            channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic", durable=True)

            # Queue durable
            channel.queue_declare(queue=RABBITMQ_QUEUE, durable=True)

            # Bindings
            channel.queue_bind(queue=RABBITMQ_QUEUE, exchange=RABBITMQ_EXCHANGE, routing_key="transaction.completed")
            channel.queue_bind(queue=RABBITMQ_QUEUE, exchange=RABBITMQ_EXCHANGE, routing_key="loan.approved")

            channel.basic_qos(prefetch_count=10)
            channel.basic_consume(queue=RABBITMQ_QUEUE, on_message_callback=callback)

            print(f"[REPORTING] Consommateur connecte sur {RABBITMQ_HOST}:{RABBITMQ_PORT}")
            print(f"[REPORTING] Ecoute de l'exchange '{RABBITMQ_EXCHANGE}' (routing keys : transaction.completed, loan.approved)")
            channel.start_consuming()

        except Exception as e:
            print(f"[REPORTING] Erreur connexion RabbitMQ : {e}")

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
