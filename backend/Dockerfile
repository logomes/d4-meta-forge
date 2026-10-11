# Python 3.15.0 via uv: a imagem oficial python:3.15-slim ainda não saiu
# (out/2026 só existe 3.15-rc). Trocar por FROM python:3.15-slim quando publicar.
FROM debian:bookworm-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.0 /uv /usr/local/bin/uv
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV PYTHONUNBUFFERED=1 UV_PYTHON_INSTALL_DIR=/opt/python UV_NO_CACHE=1 \
    VIRTUAL_ENV=/opt/venv PATH=/opt/venv/bin:$PATH
RUN uv python install 3.15.0 && uv venv /opt/venv --python 3.15.0
WORKDIR /app
COPY requirements.txt .
RUN uv pip install -r requirements.txt
COPY app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
