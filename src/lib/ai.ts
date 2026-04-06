import OpenAI from "openai";

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
        content: `Summarize this web page content:\n\n${content.slice(0, 4000)}`,
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
