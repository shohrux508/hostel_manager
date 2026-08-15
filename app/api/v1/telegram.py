from __future__ import annotations

from typing import Any

import httpx
from fastapi import APIRouter, Request
from loguru import logger

from app.core.config import settings

router = APIRouter(prefix="/telegram", tags=["Telegram"])

TELEGRAM_API_BASE = "https://api.telegram.org"


@router.get("/info")
async def get_bot_info() -> dict[str, Any]:
    """Check Telegram Bot info and webhook status."""
    if not settings.telegram_bot_token:
        return {
            "configured": False,
            "message": "TELEGRAM_BOT_TOKEN не задан в переменных окружения",
            "app_url": settings.app_public_url,
        }

    url = f"{TELEGRAM_API_BASE}/bot{settings.telegram_bot_token}/getMe"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url)
        bot_data = res.json()

    return {
        "configured": True,
        "bot": bot_data,
        "app_url": settings.app_public_url,
    }


@router.post("/set-webhook")
async def set_telegram_webhook() -> dict[str, Any]:
    """Register Railway webhook URL and Telegram Web App Menu Button."""
    if not settings.telegram_bot_token:
        return {
            "status": "error",
            "message": "Укажите TELEGRAM_BOT_TOKEN в переменных окружения",
        }

    webhook_url = f"{settings.app_public_url.rstrip('/')}/api/v1/telegram/webhook"
    token = settings.telegram_bot_token

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Set Webhook
        set_wh_res = await client.post(
            f"{TELEGRAM_API_BASE}/bot{token}/setWebhook",
            json={"url": webhook_url},
        )

        # 2. Set Menu Button (Web App)
        set_btn_res = await client.post(
            f"{TELEGRAM_API_BASE}/bot{token}/setChatMenuButton",
            json={
                "menu_button": {
                    "type": "web_app",
                    "text": "🏨 Открыть PMS",
                    "web_app": {"url": settings.app_public_url},
                }
            },
        )

    return {
        "status": "success",
        "webhook_url": webhook_url,
        "webhook_response": set_wh_res.json(),
        "menu_button_response": set_btn_res.json(),
    }


@router.post("/webhook")
async def handle_telegram_update(request: Request) -> dict[str, Any]:
    """Handle incoming updates from Telegram Bot API."""
    if not settings.telegram_bot_token:
        return {"ok": True}

    try:
        data = await request.json()
        message = data.get("message")
        if not message:
            return {"ok": True}

        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")
        token = settings.telegram_bot_token

        if text.startswith("/start") or text.startswith("/app"):
            welcome_text = (
                "🏨 <b>Добро пожаловать в Hostel PMS!</b>\n\n"
                "Система управления номерным фондом и бронированиями хостела.\n\n"
                "📊 <b>Возможности:</b>\n"
                "• Интерактивная шахматка занятости 10 комнат (40 мест)\n"
                "• Быстрое бронирование, заселение и выселение\n"
                "• База гостей и касса оплат\n\n"
                "Нажмите кнопку ниже, чтобы открыть приложение прямо в Telegram 👇"
            )

            keyboard = {
                "inline_keyboard": [
                    [
                        {
                            "text": "🚀 Открыть Hostel Manager",
                            "web_app": {"url": settings.app_public_url},
                        }
                    ]
                ]
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{TELEGRAM_API_BASE}/bot{token}/sendMessage",
                    json={
                        "chat_id": chat_id,
                        "text": welcome_text,
                        "parse_mode": "HTML",
                        "reply_markup": keyboard,
                    },
                )
    except Exception as exc:
        logger.error(f"Error handling Telegram webhook: {exc}")

    return {"ok": True}
