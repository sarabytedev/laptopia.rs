FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps for cryptography, bcrypt, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        libffi-dev \
        libssl-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Koristi prod requirements (bez emergentintegrations i dev alata).
COPY requirements.prod.txt ./
RUN pip install --upgrade pip && pip install -r requirements.prod.txt

COPY . .

# Non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

EXPOSE 8001

# Healthcheck preko Pythona (radi i bez curl-a, i pod non-root userom).
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD python -c "import urllib.request,sys; \
sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8001/api/', timeout=3).status==200 else 1)" \
    || exit 1

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
