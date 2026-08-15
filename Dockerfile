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
# Stage 2: Build Python dependencies
# ============================================================
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-editable

COPY . .

# ============================================================
# Stage 3: Production runtime
# ============================================================
FROM python:3.12-slim

# Create non-root user
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --create-home appuser

WORKDIR /app

# Copy python app and dependencies
COPY --from=builder /app /app
# Copy static frontend bundle
COPY --from=frontend-builder /frontend/out /app/frontend/out
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["uv", "run", "python", "main.py"]
