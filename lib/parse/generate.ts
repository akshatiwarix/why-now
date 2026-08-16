import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { OBSERVATION_KINDS } from "@/lib/argument/types";
import { REQUIRED_ATTRIBUTES } from "@/data/schema";
import { RESPONSE_SCHEMA, candidateListSchema, type Candidate } from "./schemas";

/**
 * The only place in this repo that calls a model.
 *
 * Its job is narrow on purpose: turn prose into typed, dated, quoted
 * observations. It does not decide whether anything is a reason to reach out,
 * it does not rank, and it does not write a sentence that reaches the user.
 * Everything downstream of here is the engine, and the engine cannot import
 * this file.
 */

export const MODEL = "gemini-3.6-flash";

const KIND_GUIDE = OBSERVATION_KINDS.map(
  (kind) => `  ${kind} — attributes: ${REQUIRED_ATTRIBUTES[kind].join(", ")}`,
).join("\n");

const SYSTEM_INSTRUCTION = `You extract observations from text about a company. You do not interpret them.

Return one entry per distinct event the text reports. For each:

- kind: one of the kinds below, or omit the entry entirely if none fits.
- excerpt: copied VERBATIM from the input, one or two sentences, long enough to stand alone. Never paraphrase; an excerpt that is not character-for-character present in the input will be discarded.
- eventDate: ISO YYYY-MM-DD for when the event happened. Use "" if the text does not say. Never infer a date from "recently", "this year", or the tone of the writing.
- publisher: who published this text.
- grade: "primary" for the company's own filings, job postings, status pages or registries; "press" for independent journalism; "self_reported" for the company's blog, marketing pages or press releases about itself.
- attributes: a flat map. Every kind has required attributes; an entry missing them is discarded.

Kinds and their required attributes:
${KIND_GUIDE}

Use lower_snake_case values for function, seniority, round, region and category — for example function "engineering", seniority "vp" or "c_level", round "series_b", region "eu", category "observability". For role_opened, set ownership to "true" only when the posting is written as a mandate to own something.

Report what the text says. Do not add events it does not mention.`;

export type GenerateResult =
  | { readonly ok: true; readonly candidates: readonly Candidate[] }
  | { readonly ok: false; readonly status: number; readonly error: string };

export function hasApiKey(): boolean {
  return (process.env.GEMINI_API_KEY ?? "").length > 0;
}

export async function extractCandidates(text: string): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (apiKey.length === 0) {
    return {
      ok: false,
      status: 501,
      error:
        "No GEMINI_API_KEY is configured, so pasted text cannot be parsed. The twelve bundled accounts work without one.",
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  let raw: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        // Not for quality: constrained extraction against a fixed schema is
        // not reasoning, and a deterministic parse is one a reviewer can
        // reproduce.
        temperature: 0,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });
    raw = response.text;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "unknown error";
    return { ok: false, status: 502, error: `The model call failed: ${message}` };
  }

  if (raw === undefined || raw.length === 0) {
    return { ok: false, status: 502, error: "The model returned an empty response." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: 502, error: "The model returned text that is not JSON." };
  }

  const result = candidateListSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      status: 502,
      error: `The model returned JSON that does not match the schema: ${result.error.issues[0]?.message ?? "unknown"}`,
    };
  }

  return { ok: true, candidates: result.data.observations };
}
