import * as cheerio from "cheerio";

/** Ссылка на публичный пост: t.me/channel/123 или telegram.me/s/channel/123 */
const TELEGRAM_POST_URL =
  /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/(?:s\/)?([a-zA-Z0-9_]+)\/(\d+)\/?$/;

export type ParsedTelegramPost = {
  channel: string;
  messageId: string;
};

export function parseTelegramPostUrl(raw: string): ParsedTelegramPost | null {
  const trimmed = raw.trim();
  const m = trimmed.match(TELEGRAM_POST_URL);
  if (!m) {
    return null;
  }
  return { channel: m[1], messageId: m[2] };
}

/**
 * Текст публичного поста через превью t.me/s/...
 * Не работает для приватных каналов и ссылок вида t.me/c/...
 */
export async function fetchPublicTelegramPostText(
  channel: string,
  messageId: string,
): Promise<string> {
  const url = `https://t.me/s/${channel}/${messageId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FindOriginBot/1.0)",
      "Accept-Language": "ru,en;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Не удалось загрузить пост (${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const dataPost = `${channel}/${messageId}`;
  const textBlock = $(`[data-post="${dataPost}"] .tgme_widget_message_text`).first();
  if (textBlock.length > 0) {
    return textBlock.text().trim();
  }

  const og = $('meta[property="og:description"]').attr("content");
  if (og?.trim()) {
    return og.trim();
  }

  throw new Error(
    "Текст поста не найден. Поддерживаются только публичные каналы (не t.me/c/...).",
  );
}
