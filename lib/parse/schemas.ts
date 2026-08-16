import { z } from "zod";
import { OBSERVATION_KINDS, SOURCE_GRADES, type Observation } from "@/lib/argument/types";
import { REQUIRED_ATTRIBUTES, isoDate } from "@/data/schema";

/**
 * The trust boundary for pasted text.
 *
 * The model is asked for a native `responseSchema`, and then everything it
 * returns is validated again here — a schema is a request, a validator is a
 * guarantee. Anything that fails is dropped with a reason rather than repaired,
 * because a repaired observation is one the engine would treat as evidence.
 */

export const candidateSchema = z.object({
  kind: z.enum(OBSERVATION_KINDS),
  // The model is told to send "" when the text carries no date. Undated is a
  // real answer here — it produces the `unsupported` verdict — so it must
  // survive validation rather than being guessed at.
  eventDate: z.preprocess((value) => (value === "" ? null : value), isoDate.nullable()),
  excerpt: z.string().min(10).max(600),
  publisher: z.string().min(1).max(120),
  grade: z.enum(SOURCE_GRADES),
  attributes: z.record(z.string(), z.union([z.string(), z.number()])),
});

export const candidateListSchema = z.object({
  observations: z.array(candidateSchema).max(25),
});

export type Candidate = z.infer<typeof candidateSchema>;

/** The shape handed to the model. Kept next to the Zod schema deliberately. */
export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    observations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: [...OBSERVATION_KINDS] },
          eventDate: {
            type: "string",
            description: "ISO YYYY-MM-DD, or the empty string when the text gives no date",
          },
          excerpt: { type: "string", description: "verbatim from the pasted text" },
          publisher: { type: "string" },
          grade: { type: "string", enum: [...SOURCE_GRADES] },
          attributes: {
            type: "object",
            description: "flat string/number map, e.g. {\"function\":\"engineering\"}",
          },
        },
        required: ["kind", "eventDate", "excerpt", "publisher", "grade", "attributes"],
      },
    },
  },
  required: ["observations"],
} as const;

export type Rejected = { readonly excerpt: string; readonly reason: string };

/**
 * Candidates become observations only if they carry what the warrant library
 * will need to test them, and only if the excerpt is actually in the text the
 * user pasted. A quote the model composed is not evidence of anything.
 */
export function toObservations(
  candidates: readonly Candidate[],
  sourceText: string,
  companyId: string,
  asOf: string,
): { readonly observations: readonly Observation[]; readonly rejected: readonly Rejected[] } {
  const observations: Observation[] = [];
  const rejected: Rejected[] = [];
  const haystack = sourceText.replace(/\s+/g, " ");

  candidates.forEach((candidate, index) => {
    if (!haystack.includes(candidate.excerpt.replace(/\s+/g, " "))) {
      rejected.push({ excerpt: candidate.excerpt, reason: "the quote is not in the pasted text" });
      return;
    }

    const missing = REQUIRED_ATTRIBUTES[candidate.kind].filter(
      (attribute) => !(attribute in candidate.attributes),
    );
    if (missing.length > 0) {
      rejected.push({
        excerpt: candidate.excerpt,
        reason: `a ${candidate.kind} needs ${missing.join(", ")}`,
      });
      return;
    }

    if (candidate.eventDate !== null && candidate.eventDate > asOf) {
      rejected.push({ excerpt: candidate.excerpt, reason: "dated after the as-of date" });
      return;
    }

    observations.push({
      id: `pasted-${index + 1}`,
      companyId,
      kind: candidate.kind,
      eventDate: candidate.eventDate,
      observedAt: candidate.eventDate ?? asOf,
      excerpt: candidate.excerpt,
      source: {
        title: candidate.publisher,
        url: "https://pasted.example/source",
        publisher: candidate.publisher,
        grade: candidate.grade,
      },
      attributes: candidate.attributes,
    });
  });

  return { observations, rejected };
}
