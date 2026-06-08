# Configuration centralisee du service
import os

# Port du service
PORT = int(os.getenv("PORT", 9004))

# RabbitMQ
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
RABBITMQ_EXCHANGE = os.getenv("RABBITMQ_EXCHANGE", "banking.events")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE", "reporting.queue")

# SQLite
DATABASE_PATH = os.getenv("DATABASE_PATH", "reporting.db")
