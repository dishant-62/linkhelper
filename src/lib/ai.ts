import OpenAI from "openai";

const MAX_AI_CONTENT_LENGTH = 4_000;

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

if (process.env.NODE_ENV !== "production") globalForOpenAI.openai = openai;

export async function summarizeUrl(content: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes web page content concisely in 2-3 sentences.",
      },
      {
        role: "user",
        content: `Summarize this web page content:\n\n${content.slice(0, MAX_AI_CONTENT_LENGTH)}`,
      },
    ],
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content ?? "";
}

export async function suggestTags(content: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that suggests relevant tags for web content. Return a JSON array of 3-5 lowercase tags.",
      },
      {
        role: "user",
        content: `Suggest tags for this content:\n\n${content.slice(0, 2000)}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 100,
  });

  try {
    const parsed = JSON.parse(
      response.choices[0]?.message?.content ?? '{"tags":[]}'
    );
    return Array.isArray(parsed.tags) ? parsed.tags : [];
  } catch {
    return [];
  }
}

export interface LinkAnalysis {
  category: string;
  tags: string[];
  summary: string;
}

/**
 * Single OpenAI call that categorises the page, generates 3-5 tags and writes
 * a 2-3 sentence summary.  Falls back to safe defaults if AI is unavailable.
 */
export async function analyzeLink(
  content: string,
  url: string
): Promise<LinkAnalysis> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that analyses web pages. " +
          "Return ONLY valid JSON with exactly these keys: " +
          '"category" (a single short category string), ' +
          '"tags" (a JSON array of 3-5 lowercase tag strings), ' +
          '"summary" (a 2-3 sentence plain-text summary).',
      },
      {
        role: "user",
        content:
          `URL: ${url}\n\nPage content:\n${content.slice(0, MAX_AI_CONTENT_LENGTH)}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<LinkAnalysis>;

  return {
    category:
      typeof parsed.category === "string" && parsed.category.trim()
        ? parsed.category.trim()
        : "General",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "No summary available",
  };
}
