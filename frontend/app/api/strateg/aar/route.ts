import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { AarRequestSchema } from "../../../strateg/schemas";
import { SYSTEM_CONTEXT, AAR_PROMPT } from "../../../strateg/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not configured on server." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  let body;
  try {
    body = AarRequestSchema.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Invalid request body";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const model = process.env.STRATEG_MODEL || "gpt-4o";

  const userText = [
    AAR_PROMPT,
    "",
    "--- STAN KOŃCOWY SCENARIUSZA ---",
    JSON.stringify(body.scenarioRun, null, 2),
    "",
    "--- SNAPSHOT KOŃCOWY (po ataku) ---",
    JSON.stringify(body.snapshot, null, 2)
  ].join("\n");

  const result = streamText({
    model: openai(model),
    system: SYSTEM_CONTEXT,
    prompt: userText,
    temperature: 0.5
  });

  return result.toTextStreamResponse();
}
