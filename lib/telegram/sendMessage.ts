import { getBotToken } from "./config";

const TELEGRAM_API = "https://api.telegram.org";

export async function sendMessage(
  chatId: number,
  text: string,
): Promise<void> {
  const token = getBotToken();
  const url = `${TELEGRAM_API}/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("sendMessage failed", res.status, body.slice(0, 500));
    throw new Error(`Telegram sendMessage: ${res.status}`);
  }
}

const MAX_MESSAGE_LENGTH = 4096;

/** Разбивает длинный текст на части для лимита Telegram. */
export function splitMessage(text: string, maxLen = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= maxLen) {
    return [text];
  }
  const parts: string[] = [];
  let rest = text;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf("\n", maxLen);
    if (cut < maxLen * 0.5) {
      cut = maxLen;
    }
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest.length > 0) {
    parts.push(rest);
  }
  return parts;
}

export async function sendLongMessage(chatId: number, text: string): Promise<void> {
  for (const part of splitMessage(text)) {
    await sendMessage(chatId, part);
  }
}
