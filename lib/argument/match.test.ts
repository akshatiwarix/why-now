import { describe, expect, it } from "vitest";
import { checkPrecondition, testAttributes, visibleObservations } from "./match";
import { observation } from "./testing";

describe("attribute tests", () => {
  const attributes = { round: "series_b", openRoles: 7, ownership: "true" };

  it("compares equality as strings so 7 and '7' agree", () => {
    expect(testAttributes({ openRoles: 7 }, { attribute: "openRoles", op: "equals", value: "7" })).toBe(true);
  });

  it("handles in, gte and exists", () => {
    expect(testAttributes(attributes, { attribute: "round", op: "in", value: ["series_b", "series_c"] })).toBe(true);
    expect(testAttributes(attributes, { attribute: "round", op: "in", value: ["series_a"] })).toBe(false);
    expect(testAttributes(attributes, { attribute: "openRoles", op: "gte", value: 5 })).toBe(true);
    expect(testAttributes(attributes, { attribute: "openRoles", op: "gte", value: 9 })).toBe(false);
    expect(testAttributes(attributes, { attribute: "ownership", op: "exists" })).toBe(true);
    expect(testAttributes(attributes, { attribute: "region", op: "exists" })).toBe(false);
  });

  it("fails rather than throws on a missing attribute", () => {
    expect(testAttributes({}, { attribute: "openRoles", op: "gte", value: 5 })).toBe(false);
  });
});

describe("visibility", () => {
  /**
   * Regression: the sweep caught a defeater firing on a report published the
   * day after the as-of date. Both dates gate visibility — an event that had
   * happened but had not yet been reported was not knowable.
   */
  it("hides an event whose only report is not published yet", () => {
    const reportedLate = observation({
      id: "late",
      kind: "headcount_contraction",
      eventDate: "2026-06-18",
      observedAt: "2026-06-19",
      attributes: { percent: 12 },
    });
    expect(visibleObservations([reportedLate], "acme", "2026-06-18")).toHaveLength(0);
    expect(visibleObservations([reportedLate], "acme", "2026-06-19")).toHaveLength(1);
  });

  it("hides undated records from corpus lookups", () => {
    const undated = observation({ id: "u", kind: "vendor_migration", eventDate: null, observedAt: "2026-01-01" });
    expect(visibleObservations([undated], "acme", "2026-08-16")).toHaveLength(0);
  });

  it("hides other companies", () => {
    const theirs = observation({ id: "t", kind: "vendor_migration", companyId: "other" });
    expect(visibleObservations([theirs], "acme", "2026-08-16")).toHaveLength(0);
  });
});

describe("corpus preconditions", () => {
  const trigger = observation({ id: "t", kind: "exec_arrival", eventDate: "2026-06-01" });
  const migration = observation({
    id: "m",
    kind: "vendor_migration",
    eventDate: "2026-01-10",
    attributes: { vendor: "Meterloop", category: "observability" },
  });

  it("holds and names its evidence", () => {
    const check = checkPrecondition(
      { scope: "corpus", kind: "vendor_migration", withinDays: 540, text: "changed vendors" },
      trigger,
      [trigger, migration],
      "2026-08-16",
    );
    expect(check).toEqual({ text: "changed vendors", held: true, evidenceId: "m" });
  });

  it("ages out past withinDays", () => {
    const check = checkPrecondition(
      { scope: "corpus", kind: "vendor_migration", withinDays: 30, text: "changed vendors" },
      trigger,
      [trigger, migration],
      "2026-08-16",
    );
    expect(check.held).toBe(false);
  });

  it("respects the attribute test on the supporting evidence", () => {
    const check = checkPrecondition(
      {
        scope: "corpus",
        kind: "vendor_migration",
        test: { attribute: "category", op: "equals", value: "crm" },
        text: "changed CRM vendors",
      },
      trigger,
      [trigger, migration],
      "2026-08-16",
    );
    expect(check.held).toBe(false);
  });
});
