import { describe, expect, it } from "vitest";
import { collapseTriggers } from "./enumerate";
import { observation } from "./testing";

describe("collapseTriggers", () => {
  const round = (id: string, publisher: string) =>
    observation({
      id,
      kind: "funding_round",
      eventDate: "2026-05-12",
      attributes: { round: "series_b" },
      eventKey: "acme-series-b",
      source: { title: id, url: `https://${publisher}.example/${id}`, publisher, grade: "press" },
    });

  it("collapses three reports of one event into one trigger", () => {
    const groups = collapseTriggers(
      [round("a", "one"), round("b", "two"), round("c", "three")],
      "acme",
      "2026-08-16",
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.reports).toHaveLength(3);
  });

  it("picks a representative that does not depend on input order", () => {
    const forwards = collapseTriggers([round("a", "one"), round("b", "two")], "acme", "2026-08-16");
    const backwards = collapseTriggers([round("b", "two"), round("a", "one")], "acme", "2026-08-16");
    expect(forwards[0]?.representative.id).toBe(backwards[0]?.representative.id);
  });

  it("never returns another company's observations", () => {
    const mine = observation({ id: "mine", kind: "exec_arrival" });
    const theirs = observation({ id: "theirs", kind: "exec_arrival", companyId: "subsidiary" });
    const groups = collapseTriggers([mine, theirs], "acme", "2026-08-16");
    expect(groups.map((group) => group.representative.id)).toEqual(["mine"]);
  });

  it("ignores kinds that are evidence but not triggers", () => {
    const departure = observation({ id: "d", kind: "exec_departure" });
    expect(collapseTriggers([departure], "acme", "2026-08-16")).toHaveLength(0);
  });

  it("hides observations the as-of date could not have seen", () => {
    const future = observation({ id: "f", kind: "exec_arrival", eventDate: "2026-09-01" });
    expect(collapseTriggers([future], "acme", "2026-08-16")).toHaveLength(0);
  });

  it("keeps undated triggers, so they can be reported as unsupported", () => {
    const undated = observation({ id: "u", kind: "exec_arrival", eventDate: null, observedAt: "2026-07-01" });
    expect(collapseTriggers([undated], "acme", "2026-08-16")).toHaveLength(1);
  });
});
