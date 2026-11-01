import * as cheerio from "cheerio";

const MAX_EXCERPT = 2500;

export async function fetchPageExcerpt(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FindOriginBot/1.0)",
        "Accept-Language": "ru,en;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) {
      return "";
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return "";
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, aside").remove();

    const og = $('meta[property="og:description"]').attr("content");
    const article = $("article p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .join(" ");
    const paragraphs = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 40)
      .slice(0, 8)
      .join(" ");

    const text = (article || paragraphs || og || $("body").text())
      .replace(/\s+/g, " ")
      .trim();
    if (!text) {
      return "";
    }
    return text.length > MAX_EXCERPT ? text.slice(0, MAX_EXCERPT) + "…" : text;
  } catch {
    return "";
  }
}
