# FindOrigin

Telegram-бот для поиска источников информации.

## Локальный запуск

1. Скопируйте `.env.example` в `.env` и задайте `TELEGRAM_BOT_TOKEN` (или `BOT_TOKEN`).
2. `OPENROUTER_API_KEY`, `OPENROUTER_MODEL=openrouter/free`.
3. `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX` — Custom Search API и ID поисковика (список сайтов в Google PSE).
4. `npm install` → `npm run dev`.
5. Пробросьте HTTPS-туннель на порт 3000 и зарегистрируйте webhook:

```powershell
$token = $env:TELEGRAM_BOT_TOKEN
$webhookUrl = "https://ВАШ-ТУННЕЛЬ/api/telegram/webhook"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{ url = $webhookUrl }
```

## Статус

Webhook → нормализация ввода → **Google Custom Search API** (до 4 запросов на сообщение) → **OpenRouter** (`openrouter/free`) → 1–3 ссылки с уверенностью. Предварительный разбор текста для пользователя не показывается.

У Google Search API есть дневная квота (часто ~100 запросов/день на бесплатном уровне) — учитывайте при тестах.
