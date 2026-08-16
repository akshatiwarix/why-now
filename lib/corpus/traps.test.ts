import { describe, expect, it } from "vitest";
import { buildHypotheses } from "@/lib/argument/index";
import { COMPANIES, DEFAULT_AS_OF, OBSERVATIONS, companyById } from "@/data/corpus";
import { SELLERS, sellerById } from "@/data/sellers";
import { WARRANTS } from "@/data/warrants";
import type { Chain, HypothesisReport } from "@/lib/argument/types";

/**
 * Twelve traps, twelve tests. Each account is engineered so that pasting its
 * evidence into a model produces a confident, wrong hypothesis; each test
 * asserts the engine does not. This is the regression suite that matters —
 * these are the twelve ways the naive build is wrong.
 */

function run(companyId: string, sellerId: string, asOf = DEFAULT_AS_OF): HypothesisReport {
  const company = companyById(companyId);
  const seller = sellerById(sellerId);
  if (company === undefined) throw new Error(`no company ${companyId}`);
  if (seller === undefined) throw new Error(`no seller ${sellerId}`);
  return buildHypotheses({ company, observations: OBSERVATIONS, warrants: WARRANTS, seller, asOf });
}

const all = (report: HypothesisReport): readonly Chain[] => [...report.emitted, ...report.rejected];
const problemOf = (chain: Chain) => chain.links[1]?.to;

describe("trap 1 — the unwarranted leap (Northwind Freight)", () => {
  it("emits nothing for a cost seller despite a Series C and a launch", () => {
    const report = run("northwind-freight", "ledgerline");
    expect(report.counts.emitted).toBe(0);
    expect(report.counts.blocked).toBeGreaterThan(0);
  });

  it("dies on relevance, not on evidence — at least one chain is valid to W3", () => {
    const report = run("northwind-freight", "ledgerline");
    const lateBlock = report.rejected.find((chain) => chain.reason?.link === "W3");
    expect(lateBlock).toBeDefined();
    expect(lateBlock?.links.slice(0, 2).every((link) => link.status === "licensed")).toBe(true);
  });
});

describe("trap 2 — the defeater in the same corpus (Calder Health)", () => {
  it("kills the arrival hypothesis with the departure six weeks later", () => {
    const report = run("calder-health", "ledgerline");
    const defeated = report.rejected.filter((chain) => chain.verdict === "defeated");
    expect(defeated.length).toBeGreaterThan(0);
    expect(defeated.every((chain) => chain.trigger.id === "ch-1")).toBe(true);
    expect(defeated[0]?.links[0]?.firedDefeater?.observation.id).toBe("ch-3");
  });

  it("emits nothing at all", () => {
    expect(run("calder-health", "ledgerline").counts.emitted).toBe(0);
  });
});

describe("trap 3 — the window that closed (Orbis Retail)", () => {
  it("is stale today", () => {
    const report = run("orbis-retail", "ledgerline");
    expect(report.counts.emitted).toBe(0);
    expect(report.counts.stale).toBeGreaterThan(0);
  });

  it("was a live hypothesis last September — 'now' is computed, not asserted", () => {
    const then = run("orbis-retail", "ledgerline", "2025-09-01");
    expect(then.counts.emitted).toBeGreaterThan(0);
  });
});

describe("trap 4 — the company quoting itself (Halberd Systems)", () => {
  it("refuses every seller", () => {
    for (const seller of SELLERS) {
      expect(run("halberd-systems", seller.id).counts.emitted).toBe(0);
    }
  });

  it("rejects at W1 on grade, naming the publisher", () => {
    const report = run("halberd-systems", "ledgerline");
    expect(report.rejected.every((chain) => chain.reason?.link === "W1")).toBe(true);
    expect(report.rejected.every((chain) => chain.reason?.detail.includes("self-reported"))).toBe(true);
  });
});

describe("trap 5 — the contradiction that runs one way (Vireo Labs)", () => {
  const report = run("vireo-labs", "ledgerline");

  it("kills the funding hypothesis with the later contraction", () => {
    const fromRound = all(report).filter((chain) => chain.trigger.id === "vl-1");
    expect(fromRound.length).toBeGreaterThan(0);
    expect(fromRound.every((chain) => chain.verdict === "defeated")).toBe(true);
    expect(fromRound[0]?.links[0]?.firedDefeater?.observation.id).toBe("vl-2");
  });

  it("keeps the contraction hypothesis, because the round came first", () => {
    const emitted = report.emitted;
    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.trigger.id).toBe("vl-2");
    expect(problemOf(emitted[0] as Chain)).toBe("no_spend_attribution");
  });
});

describe("trap 6 — the subsidiary's evidence (Pell & Roe)", () => {
  const report = run("pell-and-roe", "ledgerline");

  it("never cites the subsidiary", () => {
    for (const chain of all(report)) {
      for (const citation of chain.citations) {
        expect(citation.companyId).toBe("pell-and-roe");
      }
    }
  });

  it("blocks the observability story the merged corpus would have licensed", () => {
    const chain = all(report).find((c) => problemOf(c) === "unowned_observability_cost");
    expect(chain?.verdict).toBe("blocked");
    expect(chain?.reason?.link).toBe("W2");
  });
});

describe("trap 7 — the undated arrival (Kestrel Grid)", () => {
  const report = run("kestrel-grid", "ledgerline");

  it("cannot anchor a window to an undated leadership page", () => {
    const undated = report.rejected.filter((chain) => chain.verdict === "unsupported");
    expect(undated.length).toBeGreaterThan(0);
    expect(undated.every((chain) => chain.trigger.id === "kg-1")).toBe(true);
    expect(undated.every((chain) => chain.window === null)).toBe(true);
  });

  it("still emits from the dated posting alongside it", () => {
    expect(report.emitted.map((chain) => chain.trigger.id)).toEqual(["kg-2"]);
  });
});

describe("trap 8 — one event, three headlines (Mordant Foods)", () => {
  const report = run("mordant-foods", "ledgerline");

  it("treats three reports of one round as one trigger", () => {
    const fromRound = all(report).filter((chain) => chain.trigger.kind === "funding_round");
    const triggerIds = new Set(fromRound.map((chain) => chain.trigger.id));
    expect(triggerIds).toEqual(new Set(["mf-1"]));
    expect(report.emitted).toHaveLength(1);
  });

  it("keeps all three reports as citations", () => {
    const ids = report.emitted[0]?.citations.map((citation) => citation.id) ?? [];
    expect(ids).toEqual(expect.arrayContaining(["mf-1", "mf-2", "mf-3"]));
  });
});

describe("trap 9 — the seller-dependent verdict (Sable Freightways)", () => {
  it("gives a compliance seller two live hypotheses", () => {
    const report = run("sable-freightways", "vaultwright");
    expect(report.emitted).toHaveLength(2);
    expect(report.emitted.map(problemOf).sort()).toEqual([
      "manual_evidence_collection",
      "unmapped_data_residency",
    ]);
  });

  it("gives the other two sellers nothing, on identical evidence", () => {
    expect(run("sable-freightways", "ledgerline").counts.emitted).toBe(0);
    expect(run("sable-freightways", "northsignal").counts.emitted).toBe(0);
  });
});

describe("trap 10 — the defeater that expired (Ferrous Logic)", () => {
  const report = run("ferrous-logic", "northsignal");

  it("revives the May incident, because its postmortem is too old to still be closing anything", () => {
    const may = report.emitted.find((chain) => chain.trigger.id === "fl-1");
    expect(may).toBeDefined();
    expect(may?.links[0]?.clearedDefeaters).toContain("d-postmortem-closed-it");
  });

  it("keeps the July incident dead, because its postmortem is recent", () => {
    const july = all(report).find((chain) => chain.trigger.id === "fl-3");
    expect(july?.verdict).toBe("defeated");
    expect(july?.links[0]?.firedDefeater?.observation.id).toBe("fl-4");
  });

  it("would have killed the May incident in June, when its postmortem was fresh", () => {
    const june = run("ferrous-logic", "northsignal", "2026-06-20");
    const may = [...june.emitted, ...june.rejected].find((chain) => chain.trigger.id === "fl-1");
    expect(may?.verdict).toBe("defeated");
  });
});

describe("trap 11 — the missing precondition (Auric Ledger)", () => {
  const report = run("auric-ledger", "ledgerline");

  it("blocks the strong story, which needs evidence this company does not have", () => {
    const chain = all(report).find((c) => problemOf(c) === "unowned_observability_cost");
    expect(chain?.verdict).toBe("blocked");
    expect(chain?.reason?.detail).toContain("observability vendors");
  });

  it("ships the weaker story that is actually licensed", () => {
    expect(report.emitted.map(problemOf)).toEqual(["duplicate_tooling"]);
  });
});

describe("trap 12 — the positive control (Tessellate)", () => {
  const report = run("tessellate", "ledgerline");

  it("emits, with nothing rejected for any reason", () => {
    expect(report.emitted.length).toBeGreaterThanOrEqual(3);
    expect(report.rejected).toHaveLength(0);
  });

  it("renders a sentence for every emitted chain, with no unfilled slots", () => {
    for (const chain of report.emitted) {
      expect(chain.sentence).not.toBeNull();
      expect(chain.sentence).not.toMatch(/\{\w+\}/);
    }
  });
});

describe("the corpus as a whole", () => {
  it("gives every account a trap that the engine actually exercises", () => {
    for (const company of COMPANIES) {
      const chains = SELLERS.flatMap((seller) => all(run(company.id, seller.id)));
      expect(chains.length).toBeGreaterThan(0);
    }
  });
});
