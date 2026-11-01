import type { RankSourcesResult } from "./rankSources";

export function formatSourcesReply(result: RankSourcesResult): string {
  if (result.sources.length === 0) {
    const lines = [
      "Не удалось уверенно найти источник.",
      result.note || "Попробуйте прислать более полный текст или конкретную формулировку.",
    ];
    return lines.join("\n\n");
  }

  const lines: string[] = ["Возможные источники:", ""];
  result.sources.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.url}`);
    lines.push(`   Уверенность: ${s.confidence}`);
    lines.push(`   ${s.reason}`);
    lines.push("");
  });

  if (result.note) {
    lines.push(result.note);
  }

  return lines.join("\n").trim();
}
