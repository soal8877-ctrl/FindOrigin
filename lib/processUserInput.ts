import { extractEntities, formatEntitiesForUser } from "@/lib/extract/entities";
import { normalizeInput } from "@/lib/extract/normalizeInput";
import { endProcessing } from "@/lib/rateLimit";
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

    const entities = await extractEntities(normalized.data.text);
    const reply = formatEntitiesForUser(normalized.data.source, entities);
    await sendLongMessage(chatId, reply);
  } catch (e) {
    console.error("processUserInput error", e);
    await sendLongMessage(
      chatId,
      "Произошла ошибка при обработке. Попробуйте позже или пришлите другой текст.",
    );
  } finally {
    endProcessing(chatId);
  }
}
