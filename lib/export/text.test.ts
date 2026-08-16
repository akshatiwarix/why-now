import { describe, expect, it } from "vitest";
import { toAuditJson, toOutreachText } from "./text";
import { buildHypotheses } from "@/lib/argument/index";
import { DEFAULT_AS_OF, OBSERVATIONS, companyById } from "@/data/corpus";
import { sellerById } from "@/data/sellers";
import { WARRANTS } from "@/data/warrants";

function run(companyId: string, sellerId: string) {
  const company = companyById(companyId);
  const seller = sellerById(sellerId);
  if (company === undefined || seller === undefined) throw new Error("bad fixture");
  const report = buildHypotheses({
    company,
    observations: OBSERVATIONS,
    warrants: WARRANTS,
    seller,
    asOf: DEFAULT_AS_OF,
  });
  return { report, company, seller };
}

describe("outreach export", () => {
  it("leads with the engine's sentence, unedited", () => {
    const { report, company, seller } = run("tessellate", "ledgerline");
    const text = toOutreachText(report, company, seller);
    const sentence = report.emitted[0]?.sentence ?? "";
    expect(sentence.length).toBeGreaterThan(0);
    expect(text).toContain(sentence);
  });

  it("numbers the evidence and carries the source URL", () => {
    const { report, company, seller } = run("tessellate", "ledgerline");
    const text = toOutreachText(report, company, seller);
    expect(text).toContain("[1] ");
    expect(text).toContain(".example/");
  });

  it("names the warrants that licensed the argument", () => {
    const { report, company, seller } = run("tessellate", "ledgerline");
    expect(toOutreachText(report, company, seller)).toContain("W1 w1-");
  });

  it("says 'do not send' when nothing stands, rather than hedging", () => {
    const { report, company, seller } = run("northwind-freight", "ledgerline");
    const text = toOutreachText(report, company, seller);
    expect(text).toContain("No hypothesis stands");
    expect(text).toContain("Do not send.");
  });

  it("never leaks an unfilled template slot", () => {
    for (const companyId of ["tessellate", "vireo-labs", "kestrel-grid"]) {
      const { report, company, seller } = run(companyId, "ledgerline");
      expect(toOutreachText(report, company, seller)).not.toMatch(/\{\w+\}/);
    }
  });
});

describe("audit export", () => {
  it("round-trips and keeps every rejected chain with its reason", () => {
    const { report } = run("calder-health", "ledgerline");
    const parsed = JSON.parse(toAuditJson(report));
    expect(parsed.rejected).toHaveLength(report.rejected.length);
    for (const chain of parsed.rejected) {
      expect(chain.reason.detail.length).toBeGreaterThan(0);
    }
  });
});
