FROM python:3.11-slim

WORKDIR /app
RUN mkdir -p /data
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 -r requirements.txt
COPY . .
EXPOSE 9004
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9004"]
