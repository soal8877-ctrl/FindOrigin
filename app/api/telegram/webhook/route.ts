import { waitUntil } from "@vercel/functions";
import { beginProcessing } from "@/lib/rateLimit";
import { processUserInput } from "@/lib/processUserInput";
import { getWebhookSecret } from "@/lib/telegram/config";
import { sendMessage } from "@/lib/telegram/sendMessage";
import type { TelegramUpdate } from "@/lib/telegram/types";

export const runtime = "nodejs";

function getMessageText(update: TelegramUpdate): string | undefined {
  const msg = update.message;
  if (!msg) return undefined;
  return msg.text ?? msg.caption;
}

export async function POST(request: Request): Promise<Response> {
  const secret = getWebhookSecret();
  if (secret) {
    const header = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (header !== secret) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const chatId = update.message?.chat.id;
  const text = getMessageText(update);

  if (chatId === undefined) {
    return new Response("OK", { status: 200 });
  }

  if (!text?.trim()) {
    waitUntil(
      sendMessage(
        chatId,
        "Отправьте текст или ссылку на публичный пост Telegram.",
      ).catch((e) => console.error("sendMessage hint failed", e)),
    );
    return new Response("OK", { status: 200 });
  }

  const rateLimitMessage = beginProcessing(chatId);
  if (rateLimitMessage) {
    waitUntil(
      sendMessage(chatId, rateLimitMessage).catch((e) =>
        console.error("sendMessage rate limit failed", e),
      ),
    );
    return new Response("OK", { status: 200 });
  }

  waitUntil(
    sendMessage(chatId, "Ищу источники…").catch((e) =>
      console.error("sendMessage status failed", e),
    ),
  );

  waitUntil(
    processUserInput(chatId, text).catch((e) => {
      console.error("processUserInput unhandled", e);
    }),
  );

  return new Response("OK", { status: 200 });
}
