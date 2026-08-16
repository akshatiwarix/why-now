import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDate, fromEpochDay, toEpochDay } from "./dates";

describe("dates", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("handles the leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
  });

  it("signs the difference by direction", () => {
    expect(daysBetween("2026-08-16", "2026-08-23")).toBe(7);
    expect(daysBetween("2026-08-23", "2026-08-16")).toBe(-7);
    expect(daysBetween("2026-08-16", "2026-08-16")).toBe(0);
  });

  it("round-trips through epoch days", () => {
    for (const iso of ["1999-12-31", "2026-08-16", "2030-06-01"]) {
      expect(fromEpochDay(toEpochDay(iso))).toBe(iso);
    }
  });

  it("rejects nonsense rather than silently returning NaN", () => {
    expect(() => toEpochDay("not-a-date")).toThrow();
  });

  it("formats without depending on the reviewer's locale", () => {
    expect(formatDate("2026-06-04")).toBe("4 June 2026");
    expect(formatDate("2026-12-25")).toBe("25 December 2026");
  });
});
