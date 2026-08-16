import { z } from "zod";
import { buildHypotheses } from "@/lib/argument/index";
import { DEFAULT_AS_OF } from "@/data/corpus";
import { SELLERS, sellerById } from "@/data/sellers";
import { WARRANTS } from "@/data/warrants";
import { isoDate } from "@/data/schema";
import { extractCandidates } from "@/lib/parse/generate";
import { toObservations } from "@/lib/parse/schemas";
import { rateLimit } from "@/lib/parse/rate-limit";
import type { Company } from "@/lib/argument/types";

/**
 * The live path: prose in, typed observations out, then the same engine.
 *
 * The model's only job is the parse. Every observation it produces is checked
 * against the pasted text before it reaches `buildHypotheses`, and the engine
 * treats it exactly like a corpus record — no shortcut, no separate code path,
 * no different rules for evidence a model happened to type.
 */

export const requestSchema = z.object({
  text: z.string().min(40).max(20_000),
  companyName: z.string().min(1).max(120),
  sellerId: z.string().min(1),
  asOf: isoDate.optional(),
});

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "local";
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request body is not JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const seller = sellerById(parsed.data.sellerId);
  if (seller === undefined) {
    return Response.json(
      { error: `No seller '${parsed.data.sellerId}'.`, sellers: SELLERS.map((entry) => entry.id) },
      { status: 404 },
    );
  }

  const limit = rateLimit(clientKey(request));
  if (!limit.allowed) {
    return Response.json(
      { error: `Rate limited. Try again in ${limit.resetInSeconds}s.` },
      { status: 429, headers: { "retry-after": String(limit.resetInSeconds) } },
    );
  }

  const extraction = await extractCandidates(parsed.data.text);
  if (!extraction.ok) {
    return Response.json({ error: extraction.error }, { status: extraction.status });
  }

  const asOf = parsed.data.asOf ?? DEFAULT_AS_OF;
  const { observations, rejected } = toObservations(
    extraction.candidates,
    parsed.data.text,
    "pasted",
    asOf,
  );

  const company: Company = {
    id: "pasted",
    name: parsed.data.companyName,
    domain: "pasted.example",
    description: "Parsed from text you pasted.",
    trap: { id: 1, name: "none", expectation: "This account came from pasted text." },
  };

  const report = buildHypotheses({ company, observations, warrants: WARRANTS, seller, asOf });

  return Response.json({ report, observations, droppedCandidates: rejected });
}
