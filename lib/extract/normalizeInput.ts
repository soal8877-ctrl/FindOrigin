import {
  fetchPublicTelegramPostText,
  parseTelegramPostUrl,
} from "./telegramPost";

export type NormalizedInput = {
  text: string;
  source: "plain_text" | "telegram_post";
  telegram?: { channel: string; messageId: string; url: string };
};

export type NormalizeResult =
  | { ok: true; data: NormalizedInput }
  | { ok: false; userMessage: string };

export async function normalizeInput(raw: string): Promise<NormalizeResult> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      ok: false,
      userMessage:
        "Пришлите текст новости или ссылку на публичный пост Telegram (например, https://t.me/channel/123).",
    };
  }

  const parsed = parseTelegramPostUrl(trimmed);
  if (parsed) {
    try {
      const text = await fetchPublicTelegramPostText(
        parsed.channel,
        parsed.messageId,
      );
      if (!text) {
        return {
          ok: false,
          userMessage: "Пост пустой или не содержит текста.",
        };
      }
      return {
        ok: true,
        data: {
          text,
          source: "telegram_post",
          telegram: {
            channel: parsed.channel,
            messageId: parsed.messageId,
            url: trimmed,
          },
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки поста";
      return { ok: false, userMessage: msg };
    }
  }

  if (/^https?:\/\//i.test(trimmed) && /t\.me\/c\//i.test(trimmed)) {
    return {
      ok: false,
      userMessage:
        "Ссылки на приватные каналы (t.me/c/...) пока не поддерживаются. Скопируйте текст поста вручную.",
    };
  }

  return {
    ok: true,
    data: {
      text: trimmed,
      source: "plain_text",
    },
  };
}
