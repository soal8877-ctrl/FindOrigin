import { formatSourcesReply } from "@/lib/ai/formatResult";
import { rankSourcesWithAi } from "@/lib/ai/rankSources";
import { isAiConfigured } from "@/lib/ai/client";
import { normalizeInput } from "@/lib/extract/normalizeInput";
import { endProcessing } from "@/lib/rateLimit";
import { collectSourceCandidates } from "@/lib/search/collectCandidates";
import { getGoogleSearchConfig } from "@/lib/search/googleCustomSearch";
import { sendLongMessage } from "@/lib/telegram/sendMessage";

export async function processUserInput(
  chatId: number,
  rawInput: string,
): Promise<void> {
  try {
    const normalized = await normalizeInput(rawInput);
    if (!normalized.ok) {
      await sendLongMessage(chatId, normalized.userMessage);
      return;
    }

    if (!isAiConfigured()) {
      await sendLongMessage(
        chatId,
        "Не задан OPENROUTER_API_KEY. Добавьте ключ OpenRouter и OPENROUTER_MODEL=openrouter/free в .env.",
      );
      return;
    }

    try {
      getGoogleSearchConfig();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Настройте GOOGLE_SEARCH_API_KEY и GOOGLE_SEARCH_CX.";
      await sendLongMessage(chatId, msg);
      return;
    }

    const text = normalized.data.text;
    const candidates = await collectSourceCandidates(text);
    const ranked = await rankSourcesWithAi(text, candidates);
    const reply = formatSourcesReply(ranked);
    await sendLongMessage(chatId, reply);
  } catch (e) {
    console.error("processUserInput error", e);
    const msg =
      e instanceof Error && e.message
        ? e.message
        : "Произошла ошибка при обработке. Попробуйте позже.";
    await sendLongMessage(chatId, msg);
  } finally {
    endProcessing(chatId);
  }
}
