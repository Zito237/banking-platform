# Configuration centralisee du document-ocr-service
import os

# Port du service
PORT = int(os.getenv("PORT", 9001))

# RabbitMQ
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
RABBITMQ_EXCHANGE = os.getenv("RABBITMQ_EXCHANGE", "banking.events")
RABBITMQ_CONSUMER_QUEUE = os.getenv("RABBITMQ_CONSUMER_QUEUE", "document.ocr.queue")
RABBITMQ_PUBLISHER_QUEUE = os.getenv("RABBITMQ_PUBLISHER_QUEUE", "document.processed.queue")

# Tesseract
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "/usr/bin/tesseract")
