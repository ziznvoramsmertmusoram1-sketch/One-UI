"""
bot.py — Telegram-бот на "голом" Telegram Bot API через библиотеку requests.
Никаких aiogram/aiohttp — requests не требует компиляции C/Rust-кода,
поэтому ставится в Termux без ошибок сборки даже на самом свежем Python.

Установка:   pip install -r requirements.txt
Запуск:      python bot.py
"""

import time       # для паузы между запросами long polling
import logging    # для вывода логов в консоль
import os         # для чтения токена и адреса из переменных окружения

import requests   # единственная внешняя зависимость — чистый Python, без компиляции

# ------------------------------------------------------------------
# НАСТРОЙКИ
# ------------------------------------------------------------------

# Токен бота — получен у @BotFather.
BOT_TOKEN = os.getenv("BOT_TOKEN","8902467891:AAFPY-duDZ_STvXva75RbWStffZcclHWQnQ")

# Публичный HTTPS-адрес папки webapp/ (например, ссылка на GitHub Pages).
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-domain.example.com/webapp/index.html")

# Базовый адрес Telegram Bot API с подставленным токеном
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# ФУНКЦИИ-ОБЁРТКИ НАД TELEGRAM BOT API
# ------------------------------------------------------------------

def get_updates(offset: int) -> list:
    """
    Запрашивает у Telegram новые сообщения (long polling).
    offset — id, начиная с которого мы ещё не обрабатывали апдейты.
    timeout=30 — сервер Telegram держит соединение открытым до 30 секунд,
    если новых сообщений нет (это и есть "long" polling, экономит запросы).
    """
    response = requests.get(
        f"{API_URL}/getUpdates",
        params={"offset": offset, "timeout": 30},
        timeout=35,  # чуть больше, чем timeout в params, с запасом на сеть
    )
    response.raise_for_status()  # бросит исключение, если Telegram вернул ошибку
    return response.json()["result"]


def send_message_with_webapp_button(chat_id: int, text: str) -> None:
    """Отправляет сообщение с inline-кнопкой, открывающей Mini App."""
    payload = {
        "chat_id": chat_id,
        "text": text,
        "reply_markup": {
            "inline_keyboard": [[
                {
                    "text": "🚀 Открыть OneUI OS",
                    "web_app": {"url": WEBAPP_URL},  # именно этот тип превращает кнопку в Mini App
                }
            ]]
        },
    }
    requests.post(f"{API_URL}/sendMessage", json=payload, timeout=10)


def send_plain_message(chat_id: int, text: str) -> None:
    """Отправляет обычное текстовое сообщение без кнопок."""
    requests.post(f"{API_URL}/sendMessage", json={"chat_id": chat_id, "text": text}, timeout=10)


# ------------------------------------------------------------------
# ОБРАБОТКА ОДНОГО АПДЕЙТА
# ------------------------------------------------------------------

def handle_update(update: dict) -> None:
    message = update.get("message")
    if not message:
        return  # игнорируем апдейты без сообщения (например, редактирование чужих сообщений)

    chat_id = message["chat"]["id"]

    # Команда /start — присылаем кнопку с Mini App
    if message.get("text") == "/start":
        send_message_with_webapp_button(
            chat_id,
            "Добро пожаловать! Нажмите кнопку ниже, чтобы открыть симулятор ОС.",
        )
        return

    # Данные, присланные фронтендом через tg.sendData(...) в script.js
    if "web_app_data" in message:
        data = message["web_app_data"]["data"]
        logger.info("Получены данные из Web App: %s", data)
        send_plain_message(chat_id, f"Бэкенд получил данные из ОС: {data}")


# ------------------------------------------------------------------
# ГЛАВНЫЙ ЦИКЛ (long polling)
# ------------------------------------------------------------------

def main() -> None:
    logger.info("Бот запущен, ожидаю сообщения...")
    offset = 0  # id последнего обработанного апдейта + 1

    while True:
        try:
            updates = get_updates(offset)
            for update in updates:
                handle_update(update)
                offset = update["update_id"] + 1  # сдвигаем offset, чтобы не обрабатывать повторно
        except requests.exceptions.RequestException as e:
            # сеть могла оборваться (мобильный интернет, переход в спящий режим) — не падаем, а ждём и пробуем снова
            logger.warning("Сетевая ошибка, повтор через 5 секунд: %s", e)
            time.sleep(5)


if __name__ == "__main__":
    main()
