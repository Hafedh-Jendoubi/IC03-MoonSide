FROM python:3.12-slim

WORKDIR /app

# System deps for building wheels (kept minimal / slim image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8089

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
    CMD curl -f http://localhost:8089/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8089"]
