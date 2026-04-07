import axios from "axios";
import * as cheerio from "cheerio";

export interface PageMetadata {
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  bodyText: string;
}

export async function fetchMetadata(url: string): Promise<PageMetadata> {
  const { data: html } = await axios.get<string>(url, {
    timeout: 10_000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; LinkMindBot/1.0; +https://linkmind.app)",
    },
    maxContentLength: 2 * 1024 * 1024, // 2 MB cap
  });

  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ??
    $("title").first().text().trim() ??
    null;

  const description =
    $('meta[property="og:description"]').attr("content") ??
    $('meta[name="description"]').attr("content") ??
    null;

  const thumbnail =
    $('meta[property="og:image"]').attr("content") ?? null;

  // Collect visible body text for AI analysis (strip scripts/styles)
  $("script, style, noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000);

  return {
    title: title || null,
    description: description || null,
    thumbnail: thumbnail || null,
    bodyText,
  };
}
