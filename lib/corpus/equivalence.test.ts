import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/hypotheses/route";
import { buildHypotheses } from "@/lib/argument/index";
import { COMPANIES, DEFAULT_AS_OF, OBSERVATIONS } from "@/data/corpus";
import { SELLERS } from "@/data/sellers";
import { WARRANTS } from "@/data/warrants";
import { addDays } from "@/lib/argument/dates";

/**
 * The console runs the engine in the browser so the as-of control is instant;
 * the route runs it on the server so a verdict can be audited outside the UI.
 * Two code paths computing verdicts is the risk, and this is the test that
 * makes it a build failure rather than a discrepancy someone notices later.
 */

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("https://why-now.example/api/hypotheses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const AS_OF_DATES = [DEFAULT_AS_OF, addDays(DEFAULT_AS_OF, -200), addDays(DEFAULT_AS_OF, 60)];

describe("client and server agree", () => {
  it("byte for byte, across every account, seller and sampled date", async () => {
    for (const company of COMPANIES) {
      for (const seller of SELLERS) {
        for (const asOf of AS_OF_DATES) {
          const local = buildHypotheses({
            company,
            observations: OBSERVATIONS,
            warrants: WARRANTS,
            seller,
            asOf,
          });
          const response = await post({ companyId: company.id, sellerId: seller.id, asOf });
          expect(response.status).toBe(200);
          expect(await response.json()).toEqual(JSON.parse(JSON.stringify(local)));
        }
      }
    }
  });
});

describe("the route as an API", () => {
  it("defaults the as-of date rather than demanding one", async () => {
    const response = await post({ companyId: "tessellate", sellerId: "ledgerline" });
    expect(response.status).toBe(200);
    expect((await response.json()).asOf).toBe(DEFAULT_AS_OF);
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(
      new Request("https://why-now.example/api/hypotheses", { method: "POST", body: "nope" }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects a malformed as-of date", async () => {
    const response = await post({ companyId: "tessellate", sellerId: "ledgerline", asOf: "16/08/2026" });
    expect(response.status).toBe(400);
  });

  it("names the valid accounts when given an unknown one", async () => {
    const response = await post({ companyId: "nope", sellerId: "ledgerline" });
    expect(response.status).toBe(404);
    expect((await response.json()).accounts).toContain("tessellate");
  });

  it("names the valid sellers when given an unknown one", async () => {
    const response = await post({ companyId: "tessellate", sellerId: "nope" });
    expect(response.status).toBe(404);
    expect((await response.json()).sellers).toEqual(["ledgerline", "northsignal", "vaultwright"]);
  });
});
