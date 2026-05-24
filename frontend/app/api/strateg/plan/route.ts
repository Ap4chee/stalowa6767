import { NextRequest } from "next/server";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { PlanSchema, AssessmentSchema, TacticalSnapshotSchema } from "../../../strateg/schemas";
import { SYSTEM_CONTEXT, PLAN_PROMPT } from "../../../strateg/prompts";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  snapshot: TacticalSnapshotSchema,
  assessment: AssessmentSchema
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not configured on server." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  let body;
  try {
    body = RequestSchema.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Invalid request body";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const model = process.env.STRATEG_MODEL || "gpt-4o";

  const userText = [
    PLAN_PROMPT,
    "",
    "--- SNAPSHOT TAKTYCZNY ---",
    JSON.stringify(body.snapshot, null, 2),
    "",
    "--- OCENA SYTUACYJNA (poprzedni etap) ---",
    JSON.stringify(body.assessment, null, 2)
  ].join("\n");

  const result = streamObject({
    model: openai(model),
    schema: PlanSchema,
    system: SYSTEM_CONTEXT,
    prompt: userText,
    temperature: 0.35
  });

  return result.toTextStreamResponse();
}
