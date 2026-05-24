import { NextRequest } from "next/server";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { AssessmentSchema, TacticalSnapshotSchema } from "../../../strateg/schemas";
import { SYSTEM_CONTEXT, ASSESSMENT_PROMPT } from "../../../strateg/prompts";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  snapshot: TacticalSnapshotSchema,
  // Optional base64 PNG screenshot of the Cesium canvas (data URL without prefix)
  imageBase64: z.string().nullable().optional()
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
  const { snapshot, imageBase64 } = body;

  const userText = `${ASSESSMENT_PROMPT}\n\n--- SNAPSHOT TAKTYCZNY (JSON) ---\n${JSON.stringify(snapshot, null, 2)}`;

  const userContent: Array<
    { type: "text"; text: string } | { type: "image"; image: string }
  > = [{ type: "text", text: userText }];

  if (imageBase64) {
    userContent.push({
      type: "image",
      image: `data:image/png;base64,${imageBase64}`
    });
  }

  const result = streamObject({
    model: openai(model),
    schema: AssessmentSchema,
    system: SYSTEM_CONTEXT,
    messages: [{ role: "user", content: userContent }],
    temperature: 0.4
  });

  return result.toTextStreamResponse();
}
