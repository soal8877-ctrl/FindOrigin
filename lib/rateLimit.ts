const MIN_INTERVAL_MS = 5000;

const processing = new Set<number>();
const lastFinished = new Map<number, number>();

export function beginProcessing(chatId: number): string | null {
  if (processing.has(chatId)) {
    return "Уже обрабатываю предыдущий запрос. Подождите ответа.";
  }
  const last = lastFinished.get(chatId);
  if (last !== undefined && Date.now() - last < MIN_INTERVAL_MS) {
    return "Слишком частые запросы. Подождите несколько секунд.";
  }
  processing.add(chatId);
  return null;
}

export function endProcessing(chatId: number): void {
  processing.delete(chatId);
  lastFinished.set(chatId, Date.now());
}
