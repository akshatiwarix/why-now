import { beforeEach, describe, expect, it } from "vitest";
import { LIMIT, WINDOW_MS, rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(resetRateLimits);

  it("allows exactly LIMIT requests in a window", () => {
    const now = 1_000_000;
    for (let index = 0; index < LIMIT; index += 1) {
      expect(rateLimit("a", now + index).allowed).toBe(true);
    }
    expect(rateLimit("a", now + LIMIT).allowed).toBe(false);
  });

  it("counts each caller separately", () => {
    const now = 1_000_000;
    for (let index = 0; index < LIMIT; index += 1) rateLimit("a", now);
    expect(rateLimit("a", now).allowed).toBe(false);
    expect(rateLimit("b", now).allowed).toBe(true);
  });

  it("opens a fresh window once the old one has passed", () => {
    const now = 1_000_000;
    for (let index = 0; index < LIMIT; index += 1) rateLimit("a", now);
    expect(rateLimit("a", now + WINDOW_MS - 1).allowed).toBe(false);
    expect(rateLimit("a", now + WINDOW_MS).allowed).toBe(true);
  });

  it("reports how long is left", () => {
    const now = 1_000_000;
    for (let index = 0; index < LIMIT; index += 1) rateLimit("a", now);
    expect(rateLimit("a", now + 20_000).resetInSeconds).toBe(40);
  });
});
