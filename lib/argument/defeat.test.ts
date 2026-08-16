import { describe, expect, it } from "vitest";
import { clearedDefeaterIds, findFiredDefeater } from "./defeat";
import { observation, warrant } from "./testing";

const trigger = observation({
  id: "t",
  kind: "exec_arrival",
  eventDate: "2026-06-01",
  attributes: { personName: "A", title: "VP Engineering", function: "engineering", seniority: "vp" },
});

const rule = warrant({
  id: "w",
  defeaters: [
    {
      id: "d-left",
      kind: "exec_departure",
      match: ["function"],
      text: "the function lost its leader again",
    },
  ],
});

function departure(overrides: { id: string; eventDate: string; fn?: string }) {
  return observation({
    id: overrides.id,
    kind: "exec_departure",
    eventDate: overrides.eventDate,
    attributes: { personName: "A", title: "VP Engineering", function: overrides.fn ?? "engineering" },
  });
}

describe("defeaters", () => {
  it("fires when the rebutting evidence postdates the trigger", () => {
    const fired = findFiredDefeater(
      rule,
      trigger,
      [trigger, departure({ id: "d1", eventDate: "2026-07-15" })],
      "2026-08-16",
    );
    expect(fired?.observation.id).toBe("d1");
  });

  it("does not fire when it predates the trigger", () => {
    const fired = findFiredDefeater(
      rule,
      trigger,
      [trigger, departure({ id: "d1", eventDate: "2026-03-01" })],
      "2026-08-16",
    );
    expect(fired).toBeNull();
  });

  it("does not fire when the matched attribute differs", () => {
    const fired = findFiredDefeater(
      rule,
      trigger,
      [trigger, departure({ id: "d1", eventDate: "2026-07-15", fn: "finance" })],
      "2026-08-16",
    );
    expect(fired).toBeNull();
  });

  it("does not fire on evidence the as-of date cannot see yet", () => {
    const fired = findFiredDefeater(
      rule,
      trigger,
      [trigger, departure({ id: "d1", eventDate: "2026-07-15" })],
      "2026-07-01",
    );
    expect(fired).toBeNull();
  });

  /** Trap 10. A defeater is not a keyword — it has an age. */
  describe("expiry", () => {
    const expiring = warrant({
      id: "w-expiring",
      defeaters: [
        {
          id: "d-postmortem",
          kind: "postmortem_published",
          validForDays: 60,
          text: "a recent postmortem closed the scrutiny",
        },
      ],
    });

    const postmortem = observation({
      id: "pm",
      kind: "postmortem_published",
      eventDate: "2026-06-10",
      attributes: { severity: "major" },
    });

    it("fires while inside validForDays", () => {
      const fired = findFiredDefeater(expiring, trigger, [trigger, postmortem], "2026-07-20");
      expect(fired?.observation.id).toBe("pm");
    });

    it("stops firing once it has expired, reviving the chain", () => {
      const fired = findFiredDefeater(expiring, trigger, [trigger, postmortem], "2026-08-16");
      expect(fired).toBeNull();
    });
  });

  it("never fires against an undated trigger", () => {
    const undated = observation({ id: "t2", kind: "exec_arrival", eventDate: null, observedAt: "2026-07-01" });
    expect(
      findFiredDefeater(rule, undated, [undated, departure({ id: "d1", eventDate: "2026-07-15" })], "2026-08-16"),
    ).toBeNull();
  });

  it("reports the defeaters that were checked and did not fire", () => {
    expect(clearedDefeaterIds(rule, null)).toEqual(["d-left"]);
    const fired = findFiredDefeater(
      rule,
      trigger,
      [trigger, departure({ id: "d1", eventDate: "2026-07-15" })],
      "2026-08-16",
    );
    expect(clearedDefeaterIds(rule, fired)).toEqual([]);
  });
});
