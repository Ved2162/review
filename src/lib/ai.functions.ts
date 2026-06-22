import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  rating: z.number().min(1).max(5),
  language: z.enum(["english", "hindi", "gujarati"]),
  tone: z.string().trim().min(1).max(30).default("friendly"),
  restaurantName: z.string().min(1).max(120),
  useEmoji: z.boolean().default(true),
  count: z.number().min(1).max(6).default(4),
  businessTypeLabel: z.string().trim().min(1).max(80).default("Business"),
  keywords: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  avoidWords: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
});

export const generateReviews = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const langName = {
      english: "English",
      hindi: "Hindi (Devanagari script)",
      gujarati: "Gujarati (Gujarati script)",
    }[data.language];

    const sentiment =
      data.rating >= 5
        ? "extremely positive, glowing praise"
        : data.rating === 4
          ? "positive with mild constructive note"
          : data.rating === 3
            ? "mixed — some good, some areas to improve, balanced"
            : data.rating === 2
              ? "mostly disappointed, polite but critical"
              : "very unsatisfied, polite but clearly negative";

    const keywordLine =
      data.keywords.length > 0
        ? `Naturally weave in some of these context keywords where they fit (do NOT use all, do NOT force them): ${data.keywords.join(", ")}.`
        : "";
    const avoidLine =
      data.avoidWords.length > 0
        ? `STRICT RULE: Never use these words or any variation of them: ${data.avoidWords.join(", ")}.`
        : "";

    const sys = `You generate authentic, human-sounding Google reviews for local businesses.
Reviews must feel real — varied in length, natural phrasing, never templated, never AI-sounding.
Each suggestion must be clearly different from the others in tone, length, and wording.
Reviews MUST match the specific business category — do not mention food at a salon, or haircuts at a gym, etc.
Return ONLY valid JSON, no markdown, no commentary.`;

    const user = `Write ${data.count} different Google review suggestions for "${data.restaurantName}".
Business category: ${data.businessTypeLabel}.
Rating: ${data.rating}/5 stars (${sentiment}).
Language: write reviews in ${langName}.
Brand tone: ${data.tone}.
${data.useEmoji ? "Include 1–3 tasteful emojis in some (not all) reviews." : "Do not include emojis."}
${keywordLine}
${avoidLine}
Vary the lengths: at least one short (1 sentence), one medium (2–3 sentences), one longer (4+ sentences).
Mention realistic details that fit a ${data.businessTypeLabel} specifically — do NOT mention things unrelated to this category.

Return strict JSON in this shape:
{"reviews":[{"text":"..."},{"text":"..."}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error(`AI error: ${res.status} ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { reviews: { text: string }[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned malformed response");
    }
    let reviews = (parsed.reviews || [])
      .map((r) => (r?.text || "").trim())
      .filter(Boolean);

    // Client-side safety net: drop any review that contains an avoid word.
    if (data.avoidWords.length > 0) {
      const banned = data.avoidWords.map((w) => w.toLowerCase());
      reviews = reviews.filter((text) => {
        const lower = text.toLowerCase();
        return !banned.some((w) => lower.includes(w));
      });
    }

    if (reviews.length === 0) throw new Error("No reviews generated, please try again.");
    return { reviews };
  });
