import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type {
  FeedbackCategory,
  Sentiment,
  OverallSentiment,
  AnalyzeFeedbackResponse,
} from "@/lib/types";
import { CLASSIFIER_SYSTEM_PROMPT } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";

const MAX_ENTRIES = 50;

const classifyTool: Anthropic.Tool = {
  name: "classify_feedback",
  description: "Clasifica un fragmento de feedback de usuario en una categoría y determina su sentimiento.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        enum: ["bug", "feature_request", "elogio", "pain_point", "no_clasificable"],
        description: "La categoría que mejor describe el feedback.",
      },
      sentiment: {
        type: "string",
        enum: ["positive", "negative", "neutral"],
        description: "El sentimiento predominante del fragmento.",
      },
    },
    required: ["category", "sentiment"],
  },
};

async function classifyEntry(
  client: Anthropic,
  text: string
): Promise<{ category: FeedbackCategory; sentiment: Sentiment }> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: CLASSIFIER_SYSTEM_PROMPT,
    tools: [classifyTool],
    tool_choice: { type: "any" },
    messages: [{ role: "user", content: text }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("No tool use in response");
  }

  const input = toolUse.input as { category: FeedbackCategory; sentiment: Sentiment };
  return { category: input.category, sentiment: input.sentiment };
}

function computeOverallSentiment(sentiments: Sentiment[]): OverallSentiment {
  const unique = new Set(sentiments);
  if (unique.size === 1) return [...unique][0] as OverallSentiment;
  return "mixed";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Set it in .env.local." },
      { status: 500 }
    );
  }

  let body: { feedback?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.feedback !== "string" || body.feedback.trim() === "") {
    return NextResponse.json(
      { error: 'Body must be { feedback: "string" }.' },
      { status: 400 }
    );
  }

  const inputText = body.feedback;

  const entries = inputText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No valid entries found in feedback string." },
      { status: 400 }
    );
  }

  if (entries.length > MAX_ENTRIES) {
    return NextResponse.json(
      { error: `Too many entries (${entries.length}). Maximum allowed is ${MAX_ENTRIES}.` },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const classifications = await Promise.all(
    entries.map(async (text) => {
      try {
        const result = await classifyEntry(client, text);
        return { text, ...result };
      } catch {
        return { text, category: "no_clasificable" as FeedbackCategory, sentiment: "neutral" as Sentiment };
      }
    })
  );

  const by_category = {
    bug: 0,
    feature_request: 0,
    elogio: 0,
    pain_point: 0,
    no_clasificable: 0,
    error: 0,
  } satisfies Record<FeedbackCategory, number>;

  for (const item of classifications) {
    by_category[item.category]++;
  }

  const overall_sentiment = computeOverallSentiment(
    classifications.map((c) => c.sentiment)
  );

  const responseBody: AnalyzeFeedbackResponse = {
    items: classifications,
    summary: {
      total: classifications.length,
      by_category,
      overall_sentiment,
    },
  };

  // Persist-then-respond: a DB failure is logged but does not break the API contract.
  const { error: insertError } = await supabase.from("analyses").insert({
    user_id: user.id,
    input_text: inputText,
    items: responseBody.items,
    summary: responseBody.summary,
  });

  if (insertError) {
    console.error("[api/analyze-feedback] failed to persist analysis:", insertError);
  }

  return NextResponse.json(responseBody);
}
