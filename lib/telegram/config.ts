export function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("Не задан TELEGRAM_BOT_TOKEN (или BOT_TOKEN)");
  }
  return token;
}

export function getWebhookSecret(): string | undefined {
  return process.env.TELEGRAM_WEBHOOK_SECRET;
}
