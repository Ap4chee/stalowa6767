import { NextRequest } from "next/server";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  RedTeamScenarioSchema,
  PlanSchema,
  TacticalSnapshotSchema
} from "../../../strateg/schemas";
import { SYSTEM_CONTEXT, REDTEAM_PROMPT } from "../../../strateg/prompts";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  snapshot: TacticalSnapshotSchema,
  plan: PlanSchema
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
    REDTEAM_PROMPT,
    "",
    "--- SNAPSHOT TAKTYCZNY (rozstawione obecnie systemy) ---",
    JSON.stringify(body.snapshot, null, 2),
    "",
    "--- PLAN OBROŃCY ---",
    JSON.stringify(body.plan, null, 2)
  ].join("\n");

  const result = streamObject({
    model: openai(model),
    schema: RedTeamScenarioSchema,
    system: SYSTEM_CONTEXT,
    prompt: userText,
    // Slightly higher temperature for adversarial creativity
    temperature: 0.7
  });

  return result.toTextStreamResponse();
}
