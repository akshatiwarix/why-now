import { z } from "zod";
import { buildHypotheses } from "@/lib/argument/index";
import { COMPANIES, DEFAULT_AS_OF, OBSERVATIONS, companyById } from "@/data/corpus";
import { SELLERS, sellerById } from "@/data/sellers";
import { WARRANTS } from "@/data/warrants";
import { isoDate } from "@/data/schema";

/**
 * The auditable path.
 *
 * The console computes verdicts in the browser so the as-of control is
 * instant. This route runs the *same* `buildHypotheses` on the server, and
 * `lib/corpus/equivalence.test.ts` asserts the two agree byte for byte across
 * the sweep cross-product. Two code paths computing verdicts differently is
 * the failure that test exists to catch.
 *
 * No key required. No model involved.
 */

export const requestSchema = z.object({
  companyId: z.string().min(1),
  sellerId: z.string().min(1),
  asOf: isoDate.optional(),
});

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

  const company = companyById(parsed.data.companyId);
  if (company === undefined) {
    return Response.json(
      {
        error: `No account '${parsed.data.companyId}'.`,
        accounts: COMPANIES.map((entry) => entry.id),
      },
      { status: 404 },
    );
  }

  const seller = sellerById(parsed.data.sellerId);
  if (seller === undefined) {
    return Response.json(
      { error: `No seller '${parsed.data.sellerId}'.`, sellers: SELLERS.map((entry) => entry.id) },
      { status: 404 },
    );
  }

  const report = buildHypotheses({
    company,
    observations: OBSERVATIONS,
    warrants: WARRANTS,
    seller,
    asOf: parsed.data.asOf ?? DEFAULT_AS_OF,
  });

  return Response.json(report);
}
