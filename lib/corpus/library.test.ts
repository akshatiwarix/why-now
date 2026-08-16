import { describe, expect, it } from "vitest";
import {
  BUYER_STATES,
  OBSERVATION_KINDS,
  PROBLEM_CLASSES,
  TRIGGER_KINDS,
} from "@/lib/argument/types";
import { W1_WARRANTS, W2_WARRANTS, WARRANTS } from "@/data/warrants";
import { SELLERS } from "@/data/sellers";

describe("warrant library", () => {
  it("has unique warrant ids", () => {
    const ids = WARRANTS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique defeater ids", () => {
    const ids = WARRANTS.flatMap((w) => w.defeaters.map((d) => d.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("routes W1 from a trigger kind to a buyer state, with a window", () => {
    for (const warrant of W1_WARRANTS) {
      expect(TRIGGER_KINDS).toContain(warrant.from);
      expect(BUYER_STATES).toContain(warrant.to);
      expect(warrant.windowDays).toBeGreaterThan(0);
    }
  });

  it("routes W2 from a buyer state to a problem class, with no window", () => {
    for (const warrant of W2_WARRANTS) {
      expect(BUYER_STATES).toContain(warrant.from);
      expect(PROBLEM_CLASSES).toContain(warrant.to);
      expect(warrant.windowDays).toBeUndefined();
    }
  });

  it("only declares defeaters against real observation kinds", () => {
    for (const warrant of WARRANTS) {
      for (const defeater of warrant.defeaters) {
        expect(OBSERVATION_KINDS).toContain(defeater.kind);
      }
    }
  });

  it("covers all ten trigger kinds", () => {
    const covered = new Set(W1_WARRANTS.map((w) => w.from));
    expect([...covered].sort()).toEqual([...TRIGGER_KINDS].sort());
  });

  it("continues every buyer state W1 can reach", () => {
    const reached = new Set(W1_WARRANTS.map((w) => w.to));
    const continued = new Set(W2_WARRANTS.map((w) => w.from));
    for (const state of reached) {
      expect(continued.has(state)).toBe(true);
    }
  });
});

describe("sellers", () => {
  it("gives every seller four capabilities with unique ids", () => {
    for (const seller of SELLERS) {
      expect(seller.capabilities).toHaveLength(4);
      const ids = seller.capabilities.map((c) => c.id);
      expect(new Set(ids).size).toBe(4);
    }
  });

  /**
   * Decision 16. If this test starts failing because someone added a
   * capability, the fix is to remove the capability — not to update the test.
   * The gap is what makes `blocked` reachable on the fourth rung.
   */
  it("leaves exactly two problem classes solved by nobody", () => {
    const solved = new Set(SELLERS.flatMap((s) => s.capabilities.flatMap((c) => c.solves)));
    const unsolved = PROBLEM_CLASSES.filter((problem) => !solved.has(problem));
    expect(unsolved.sort()).toEqual(["fragmented_customer_data", "onboarding_latency"]);
  });

  it("only claims to solve problems W2 can actually reach", () => {
    const reachable = new Set(W2_WARRANTS.map((w) => w.to));
    for (const seller of SELLERS) {
      for (const capability of seller.capabilities) {
        for (const problem of capability.solves) {
          expect(reachable.has(problem)).toBe(true);
        }
      }
    }
  });
});
