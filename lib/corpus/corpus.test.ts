import { describe, expect, it } from "vitest";
import { COMPANIES, DEFAULT_AS_OF, OBSERVATIONS, observationsFor } from "@/data/corpus";
import { TRIGGER_KINDS } from "@/lib/argument/types";

describe("corpus", () => {
  it("imports — which means Zod and the structural checks passed", () => {
    expect(COMPANIES).toHaveLength(12);
    expect(OBSERVATIONS.length).toBeGreaterThan(30);
  });

  it("keeps every domain synthetic", () => {
    for (const company of COMPANIES) {
      expect(company.domain.endsWith(".example")).toBe(true);
    }
  });

  it("only cites .example URLs", () => {
    for (const observation of OBSERVATIONS) {
      expect(new URL(observation.source.url).hostname.endsWith(".example")).toBe(true);
    }
  });

  it("gives every company at least one observation of a trigger kind", () => {
    for (const company of COMPANIES) {
      const kinds = observationsFor(company.id).map((o) => o.kind);
      expect(kinds.some((kind) => (TRIGGER_KINDS as readonly string[]).includes(kind))).toBe(true);
    }
  });

  it("holds an entity that owns evidence but is not a listed account", () => {
    const listed = new Set(COMPANIES.map((c) => c.id));
    const owners = new Set(OBSERVATIONS.map((o) => o.companyId));
    expect([...owners].filter((id) => !listed.has(id))).toEqual(["pell-analytics"]);
  });

  it("dates everything at or before the default as-of", () => {
    for (const observation of OBSERVATIONS) {
      expect(observation.observedAt <= DEFAULT_AS_OF).toBe(true);
    }
  });
});
