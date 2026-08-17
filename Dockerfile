# ============================================================
# Stage 1: Build Frontend (Next.js Static Export)
# ============================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ============================================================
# Stage 2: Production runtime (Python 3.12)
# ============================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# Create non-root user
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --create-home appuser

WORKDIR /app

# Install uv binary
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Python dependencies directly in runtime stage to avoid broken symlinks
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-editable

# Copy Python application code
COPY . .

# Copy static frontend bundle from Stage 1
COPY --from=frontend-builder /frontend/out /app/frontend/out

# Ensure correct file permissions for appuser
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["python", "main.py"]
