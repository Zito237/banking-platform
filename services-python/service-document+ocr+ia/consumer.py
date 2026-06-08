# Consommateur RabbitMQ : ecoute document.submitted et publie document.processed
import json
import threading
import requests
import pika
from config import (
    RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASS,
    RABBITMQ_EXCHANGE, RABBITMQ_CONSUMER_QUEUE
)
from ocr_engine import extract_text


def process_document(payload: dict) -> dict:
    # Telecharge l'image depuis l'URL, fait l'OCR, retourne le resultat
    file_url = payload.get("fileUrl") or payload.get("file_url")
    document_id = payload.get("documentId") or payload.get("document_id")
    customer_id = payload.get("customerId") or payload.get("customer_id")

    if not file_url:
        raise ValueError("fileUrl manquant dans l'evenement")

    # Telecharge l'image
    response = requests.get(file_url, timeout=30)
    response.raise_for_status()
    image_bytes = response.content

    # OCR
    result = extract_text(image_bytes)

    # Construit l'evenement de sortie
    return {
        "documentId": document_id,
        "customerId": customer_id,
        "fields": result["fields"],
        "rawText": result["rawText"],
        "confidence": result["confidence"],
        "engine": result["engine"],
        "status": "DONE"
    }


def callback(ch, method, properties, body):
    # Callback appele a chaque message recu
    try:
        payload = json.loads(body.decode("utf-8"))
        routing_key = method.routing_key

        if routing_key == "document.submitted":
            print(f"[OCR] Traitement du document : {payload.get('documentId')}")
            result = process_document(payload)

            # Publie l'evenement document.processed
            ch.basic_publish(
                exchange=RABBITMQ_EXCHANGE,
                routing_key="document.processed",
                body=json.dumps(result).encode("utf-8"),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Message persistant
                    content_type="application/json"
                )
            )
            print(f"[OCR] Document traite, confiance : {result['confidence']}%")
        else:
            print(f"[OCR] Cle ignoree : {routing_key}")

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"[OCR] Erreur traitement : {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def start_consumer():
    # Demarre le consommateur dans un thread separe
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
            channel.queue_declare(queue=RABBITMQ_CONSUMER_QUEUE, durable=True)

            # Binding
            channel.queue_bind(
                queue=RABBITMQ_CONSUMER_QUEUE,
                exchange=RABBITMQ_EXCHANGE,
                routing_key="document.submitted"
            )

            channel.basic_qos(prefetch_count=5)
            channel.basic_consume(queue=RABBITMQ_CONSUMER_QUEUE, on_message_callback=callback)

            print(f"[OCR] Consommateur connecte sur {RABBITMQ_HOST}:{RABBITMQ_PORT}")
            print(f"[OCR] Ecoute de 'document.submitted' sur l'exchange '{RABBITMQ_EXCHANGE}'")
            channel.start_consuming()

        except Exception as e:
            print(f"[OCR] Erreur connexion RabbitMQ : {e}")

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
