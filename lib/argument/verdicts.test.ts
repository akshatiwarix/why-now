import { describe, expect, it } from "vitest";
import { buildHypotheses } from "./index";
import { company, observation, seller, warrant } from "./testing";
import type { Warrant } from "./types";

/**
 * One test per verdict, on fixtures small enough that the cause is obvious.
 * The engineered corpus exercises the same five states against realistic
 * evidence in `lib/corpus/traps.test.ts`.
 */

const W1: Warrant = warrant({
  id: "w1",
  link: "W1",
  from: "exec_arrival",
  to: "stack_under_review",
  phrase: "{companyName} hired {personName} on {triggerDate}.",
  requiresGrade: ["primary", "press"],
  windowDays: 90,
  defeaters: [{ id: "d-left", kind: "exec_departure", match: ["function"], text: "they left again" }],
});

const W2: Warrant = warrant({
  id: "w2",
  link: "W2",
  from: "stack_under_review",
  to: "duplicate_tooling",
  phrase: "Reviews find overlapping tools.",
  windowDays: undefined,
  preconditions: [
    {
      scope: "corpus",
      kind: "vendor_migration",
      withinDays: 540,
      text: "the company has changed vendors recently",
    },
  ],
});

const arrival = observation({
  id: "t",
  kind: "exec_arrival",
  eventDate: "2026-06-01",
  attributes: { personName: "Rae Lund", title: "VP Engineering", function: "engineering", seniority: "vp" },
});

const migration = observation({
  id: "m",
  kind: "vendor_migration",
  eventDate: "2026-01-10",
  attributes: { vendor: "Meterloop", category: "observability" },
});

function run(observations = [arrival, migration], asOf = "2026-08-01") {
  return buildHypotheses({
    company: company(),
    observations,
    warrants: [W1, W2],
    seller: seller(),
    asOf,
  });
}

describe("verdicts", () => {
  it("emits when all four links are licensed and the window is open", () => {
    const report = run();
    expect(report.counts.emitted).toBe(1);
    const chain = report.emitted[0];
    expect(chain?.links.map((link) => link.status)).toEqual([
      "licensed",
      "licensed",
      "licensed",
      "licensed",
    ]);
    expect(chain?.window?.closesOn).toBe("2026-08-30");
    expect(chain?.sentence).toContain("Acme hired Rae Lund on 1 June 2026.");
    expect(chain?.sentence).toContain("Testco fixes it.");
    expect(chain?.sentence).toContain("29 days from now");
  });

  it("blocks at W2 when a corpus precondition is absent", () => {
    const report = run([arrival]);
    expect(report.counts.blocked).toBe(1);
    expect(report.rejected[0]?.reason?.link).toBe("W2");
    expect(report.rejected[0]?.sentence).toBeNull();
  });

  it("blocks at W3 when the seller solves nothing the chain reached", () => {
    const report = buildHypotheses({
      company: company(),
      observations: [arrival, migration],
      warrants: [W1, W2],
      seller: seller({ capabilities: [] }),
      asOf: "2026-08-01",
    });
    expect(report.rejected[0]?.reason?.link).toBe("W3");
    expect(report.rejected[0]?.links[2]?.detail).toContain("valid up to here");
  });

  it("blocks at W1 when the only source is the company describing itself", () => {
    const selfReported = observation({
      ...arrival,
      id: "t-self",
      source: {
        title: "Our new VP",
        url: "https://acme.example/blog/new-vp",
        publisher: "Acme blog",
        grade: "self_reported",
      },
    });
    const report = run([selfReported, migration]);
    expect(report.rejected[0]?.reason?.link).toBe("W1");
    expect(report.rejected[0]?.reason?.detail).toContain("self-reported");
  });

  it("defeats when rebutting evidence fires", () => {
    const departure = observation({
      id: "d",
      kind: "exec_departure",
      eventDate: "2026-07-10",
      attributes: { personName: "Rae Lund", title: "VP Engineering", function: "engineering" },
    });
    const report = run([arrival, migration, departure]);
    expect(report.counts.defeated).toBe(1);
    expect(report.rejected[0]?.links[0]?.firedDefeater?.observation.id).toBe("d");
    expect(report.rejected[0]?.citations.map((c) => c.id)).toContain("d");
  });

  it("goes stale once the window closes behind the as-of date", () => {
    const report = run([arrival, migration], "2026-09-15");
    expect(report.counts.stale).toBe(1);
    expect(report.rejected[0]?.window?.closesInDays).toBeLessThan(0);
  });

  it("is unsupported when the trigger carries no date", () => {
    const undated = observation({ ...arrival, id: "t-undated", eventDate: null, observedAt: "2026-06-01" });
    const report = run([undated, migration]);
    expect(report.counts.unsupported).toBe(1);
    expect(report.rejected[0]?.window).toBeNull();
  });

  it("reports the earliest broken rung when more than one is broken", () => {
    const report = run([arrival], "2026-09-15"); // W2 unmet AND window closed
    expect(report.rejected[0]?.verdict).toBe("blocked");
    expect(report.rejected[0]?.reason?.link).toBe("W2");
  });

  it("shows the defeaters it checked and cleared", () => {
    expect(run().emitted[0]?.links[0]?.clearedDefeaters).toEqual(["d-left"]);
  });

  it("orders emitted chains by window tightness", () => {
    const later = observation({
      id: "t2",
      kind: "exec_arrival",
      eventDate: "2026-06-20",
      attributes: { personName: "Sam Iyer", title: "VP Engineering", function: "engineering", seniority: "vp" },
    });
    const report = run([arrival, later, migration]);
    const closing = report.emitted.map((chain) => chain.window?.closesInDays ?? 0);
    expect(closing).toEqual([...closing].sort((a, b) => a - b));
  });
});
