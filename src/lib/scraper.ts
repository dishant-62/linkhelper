import axios from "axios";
import * as cheerio from "cheerio";
import { resolve4, resolve6 } from "dns/promises";

const MAX_BODY_TEXT_LENGTH = 8_000;
const MAX_REDIRECTS = 5;

// RFC-1918 / loopback / link-local CIDR patterns used for SSRF protection
const BLOCKED_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc/i,
  /^fd/i,
];

function isBlockedIp(ip: string): boolean {
  return BLOCKED_IP_PATTERNS.some((re) => re.test(ip));
}

async function assertPublicHostname(hostname: string): Promise<void> {
  if (hostname === "localhost") {
    throw new Error(`Blocked hostname: ${hostname}`);
  }

  const results = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
  const ips: string[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  if (ips.length === 0) return;

  if (ips.some(isBlockedIp)) {
    throw new Error(`Blocked private/internal IP resolved for hostname: ${hostname}`);
  }
}

/**
 * Performs an HTTP GET request while manually following redirects so that
 * every intermediate hostname is validated against the SSRF blocklist.
 */
async function safeGet(url: string): Promise<string> {
  let currentUrl = url;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const parsed = new URL(currentUrl);
    await assertPublicHostname(parsed.hostname);

    const response = await axios.get<string>(currentUrl, {
      timeout: 10_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LinkMindBot/1.0; +https://linkmind.app)",
      },
      maxContentLength: 2 * 1024 * 1024,
      // Never auto-follow — we validate each hop ourselves
      maxRedirects: 0,
      validateStatus: (status) => status < 400 || (status >= 301 && status <= 308),
    });

    const isRedirect = response.status >= 301 && response.status <= 308;
    if (!isRedirect) {
      return typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
    }

    const location = response.headers["location"] as string | undefined;
    if (!location) break;
    currentUrl = new URL(location, currentUrl).href;
  }

  throw new Error("Too many redirects");
}

export interface PageMetadata {
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  bodyText: string;
}

export async function fetchMetadata(url: string): Promise<PageMetadata> {
  const html = await safeGet(url);

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
  const bodyText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_BODY_TEXT_LENGTH);

  return {
    title: title || null,
    description: description || null,
    thumbnail: thumbnail || null,
    bodyText,
  };
}
