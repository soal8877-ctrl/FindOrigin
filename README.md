# FindOrigin

Telegram-бот для поиска источников информации.

## Локальный запуск

1. Скопируйте `.env.example` в `.env` и задайте `TELEGRAM_BOT_TOKEN` (или `BOT_TOKEN`).
2. Опционально: `OPENAI_API_KEY` для AI-разбора утверждений.
3. `npm install` → `npm run dev`.
4. Пробросьте HTTPS-туннель на порт 3000 и зарегистрируйте webhook:

```powershell
$token = $env:TELEGRAM_BOT_TOKEN
$webhookUrl = "https://ВАШ-ТУННЕЛЬ/api/telegram/webhook"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body @{ url = $webhookUrl }
```

## Статус по PLAN.md

Реализованы этапы 0–4 (до веб-поиска): webhook, фоновая обработка, нормализация ввода, извлечение сущностей.
