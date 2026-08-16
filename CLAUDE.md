# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project state

Day 007 of a 100-day building challenge. **`PLAN.md` is the contract.** It records 26 settled
decisions from a four-round design interview; they are decided, not open. Do not relitigate them
mid-build, and do not quietly expand the MVP — the "Out (explicitly)" list in `PLAN.md` is as
binding as the "In" list.

At the time this file was written the repo contains `PLAN.md` and `LICENSE` only. Everything
below describes the build `PLAN.md` specifies. Commit order lives in *Implementation task order*;
each step is one commit, pushed to `main` immediately.

## The thesis, in one paragraph

A "why now" is an **argument**, not a signal list. Every tool in this category produces
well-cited non-sequiturs — "they raised a Series B, so they need our SOC 2 automation" — because
the inferential leap happens in the gap between two sentences, which is exactly where nothing is
rendered. This repo makes the inference structural: a Toulmin chain of four typed links, each one
licensed by a declared **warrant** or visibly broken. Warrants carry preconditions and
**defeaters**, so the system looks for what would kill a hypothesis instead of only accumulating
support. "Now" is a computed window, not a tense. Sibling repos own the neighbouring problems —
Day 005 `signal-scout` ranks accounts by timeliness, Day 006 `account-brief` resolves citations to
character spans. **Do not rebuild either here.** Day 007's only claim is inference validity.

## Commands

Land these in `package.json` at scaffold time; they mirror Days 001–006 so a reviewer types the
same thing in every repo.

```bash
npm run dev                      # dev server
npm run build                    # production build — run before claiming done
npm test                         # vitest run (globs lib/**/*.test.ts only)
npm run test:watch               # watch mode
npm run sweep                    # invariant sweep, 12 accounts × 3 sellers × ~365 dates, no network
npm run typecheck                # next typegen && tsc --noEmit
npm run lint                     # eslint
npx vitest run lib/argument/defeat.test.ts          # single file
npx vitest run -t "defeater dated before the trigger"   # single test by name
```

`npm` is the committed package manager — README and lockfile stay npm even if bun is used
locally, because `npm install && npm run dev` is what a reviewer types without reading.

Four setup facts inherited from Days 001–006:

- Vitest config belongs in `vitest.config.mts` (`.mts`, not `.ts` — the extension is what stops
  Vite's config loader warning about ESM-in-CJS), and it globs `lib/**/*.test.ts` only. Tests
  outside `lib/` will not run.
- `tsc` alone fails on a clean checkout because `LayoutProps` and friends are generated into
  `.next/types`, so `typecheck` must run `next typegen` first. Never "fix" that error by editing
  `app/layout.tsx`.
- `tsconfig.json` sets `noUncheckedIndexedAccess` on top of `strict` — array and record access
  yields `T | undefined`. Handle it; do not reach for `!`.
- Scripts run through `vite-node -c vitest.config.mts` rather than bare `node`, because the engine
  uses extensionless relative imports that Node's ESM resolver rejects and the `@/` alias lives in
  the Vitest config.

## Architecture

```
                    ┌─ server component ─► data/corpus.ts (Zod-validated at import)
Browser ────────────┤
                    ├─ lib/argument (pure) ─► same function runs client-side and server-side
                    │
                    ├─ POST /api/hypotheses         ─► Zod ─► lib/argument   (auditable JSON)
                    └─ POST /api/parse-observations ─► Zod ─► key check ─► rate limit
                                                         └─ lib/parse (model, one call)
```

`lib/argument/` is the engine. Around it sit `lib/parse/` (Gemini call, prompt, response schema,
rate limiter, paste validation), `data/` (corpus, sellers, warrant library), `app/api/`, `app/`.

**`lib/argument/` imports nothing non-relative** — not `next`, not `react`, not `zod`, not
`@google/genai`, not `@/data`. `purity.test.ts` enforces it by scanning for bare import
specifiers, with no allowlist. If a change to the engine needs a package, move the code to
`lib/parse/` or the route handler instead of widening the rule. This is not stylistic: a module
that cannot import a model client cannot invent a warrant, so every link in every emitted chain
must have come from the declared library that was passed in as an argument.

**`buildHypotheses({ company, observations, warrants, seller, asOf })` is the only exported engine
function.** Route handlers and components must not reach into `enumerate.ts`, `license.ts` or
`defeat.ts` directly.

**The engine ships to the browser.** It is pure and cheap, and moving the as-of date must
recompute without a round trip. `/api/hypotheses` runs the *same* function server-side for
programmatic use, and `equivalence.test.ts` asserts both produce byte-identical JSON across the
sweep cross-product. Two code paths computing verdicts differently is the failure this test
exists to catch.

**Warrants are data, not code.** They live in `data/warrants.ts` with `preconditions`,
`defeaters`, `windowDays`, and a `phrase` template. Adding a rule means adding a record. If you
find yourself writing `if (trigger.kind === ...)` inside `lib/argument/`, the rule belongs in the
library instead.

## Rules that are easy to break by accident

- **Never add a score.** Decision 18. No 0–100, no confidence float, no "strength" number that
  gets summed or sorted on. A chain stands or it is dead with a named reason; emitted chains order
  by window tightness, then recency. A score is how this project turns back into Day 005.
- **Prose only ever comes from warrant `phrase` templates.** The model must not phrase, polish, or
  summarise a hypothesis. The rendered text is a pure function of the licensed structure — you
  cannot get nicer wording than the engine licensed, and that is the point.
- **Defeaters are declared, never generated.** A model asked "what would kill this?" invents
  plausible conditions and never finds them present. Defeaters live on warrants and are matched
  against observations.
- **Defeater timing has two halves — keep both.** A defeater fires only if its observation
  postdates the trigger *and* is itself still inside `validForDays`. A hiring freeze from before
  the surge is not a rebuttal; a certification achieved 400 days ago does not defeat the next
  audit cycle. Trap 10 exists to catch a regression here.
- **`observedAt` and `eventDate` are not interchangeable.** Windows anchor on `eventDate`. An
  undated observation cannot anchor one, which is what makes `unsupported` a real verdict rather
  than a cosmetic one.
- **Never widen a chain across companies.** Subsidiaries carry their own `companyId`. The sweep
  asserts no chain cites another company's observation; trap 6 is the fixture.
- **`self_reported` evidence alone cannot license a warrant** that sets `requiresGrade`. Marketing
  copy about a company is written by that company.
- **Collapse by `eventKey` before enumerating.** Three press reports of one funding round are one
  trigger. Skipping this makes the corpus look richer than it is.
- **Rejected chains are a shipped feature, open by default** — not debug output. Every rejection
  carries the rung that broke and the evidence that broke it, including the *negative* result
  ("these defeaters were checked and did not fire").
- **No live URL fetching.** The paste panel is the live path. A fetch-any-URL endpoint is SSRF.
- **Two problem classes deliberately have no seller** (`fragmented_customer_data`,
  `onboarding_latency`). Do not "fix" the gap by adding a capability — it is what makes `blocked`
  reachable on the fourth rung.

## Gemini conventions (inherited from Days 001–006)

`@google/genai`, model `gemini-3.6-flash`, `responseMimeType: "application/json"` with a native
`responseSchema`, then Zod as the trust boundary — a schema is a request, a validator is a
guarantee. `ThinkingLevel.MINIMAL`: this is constrained extraction against a fixed schema, not
reasoning. `temperature: 0`.

Missing key → **501** with a message pointing at the bundled corpus. Model failure → **502**. The
app must render all twelve accounts, all three sellers, every rejected chain and both exports with
`GEMINI_API_KEY` unset.

## Next.js 16

**Next.js 16 differs from training data.** `AGENTS.md` (regenerated by `next dev`) points at
`node_modules/next/dist/docs/`. Read the relevant guide there before writing route handlers or
server components rather than reaching for remembered Next 13/14 patterns.
