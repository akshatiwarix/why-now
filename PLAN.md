# Day 007 — WhyNow — Implementation Plan

Day 007 of a 100-day building challenge. The concept is fixed by the master
backlog (`~/Desktop/100-days-portfolio-execution-plan.md`): *a system that turns
current company evidence into an explainable 'why now?' outreach hypothesis.*
Every choice below came out of a decision-by-decision interview across four
rounds and is deliberate rather than a default. The 26 settled decisions are
recorded at the bottom; treat them as decided, not as open questions to
relitigate.

**Time limit:** one day. Feature-frozen at plan sign-off.

---

## Problem

A "why now" is the one sentence in a cold email that has to do real work. It is
also the sentence every tool in this category fakes, because faking it is
indistinguishable from doing it when you only read the output.

The default build is four lines of code: collect some recent facts about a
company, hand them to a model, ask for a compelling reason to reach out today.
What comes back is fluent, specific, correctly dated, and — often — an argument
that does not follow. That combination is worse than no output at all. A rep who
sends a why-now that does not follow has told a VP of Engineering that the rep
does not understand their business, using evidence that proves the rep looked.

Four failures live inside that default build, and this repo exists because of
them.

**The inferential leap is invisible.** "They raised a Series B, so they need our
SOC 2 automation." Read quickly, that scans. Read slowly, there is no link
between the two halves — a round of funding is not an audit deadline, and
nothing in the evidence says the company committed to a certification. The leap
happens in the gap between two sentences, which is precisely where nothing is
rendered. Every tool in this space is a machine for producing well-cited
non-sequiturs.

**Disconfirming evidence is never sought.** The pipeline is built to find
reasons. Ask it for a reason and it returns one; the corpus containing the job
posting that was *filled last week*, or the executive who *left again in
August*, is the same corpus, and nothing in the pipeline is looking. A system
that can only accumulate support is not reasoning, it is advocacy.

**"Now" is asserted, not computed.** The output says *now* because the prompt
said now. Nothing in the system holds an opinion about how long a trigger stays
actionable, so a funding round from fourteen months ago and one from last
Tuesday produce the same urgency, in the same present tense.

**Relevance to the seller is assumed.** The hardest link in the chain — this
company's newly-created problem is a problem *my product solves* — is the one
the model is least equipped to check and most willing to assert. Swap the seller
and the same evidence yields the same confident hypothesis with the product name
changed.

So the interesting problems are:

- Can the inference be made **structural** — a chain of typed links, each one
  either licensed by a declared rule or visibly broken?
- Can the system be made to **look for what would kill** each hypothesis, and
  report the kill?
- Can "now" be a **computed window** rather than a tense?
- Does changing the seller change the verdict, including all the way to *no
  hypothesis exists*?
- Can a reviewer point at any emitted sentence and name the rule that licensed
  it?

That is an argumentation problem with a defeasibility model on top, and it is
what this project builds.

## Intended user

A rep, SDR or founder about to write to **one** account, who wants to know
whether they actually have a reason today — and, if they do not, to find that
out in five seconds rather than after the send.

The list-triage user is deliberately not served here. Ranking an account list by
timeliness is Day 005 (`signal-scout`), it is already shipped, and rebuilding it
would spend the day re-deciding solved questions. WhyNow starts *after* the
board has told you which account to open.

Secondary user: whoever reads the repo to judge whether the author can tell the
difference between a fluent hypothesis and a valid one.

## User journey

1. Land on the app. Bundled corpus, twelve accounts, a seller already selected,
   an account already open — no upload, no key, no config, no empty state.
2. Read the emitted hypotheses. Each renders as a **ladder**: the trigger
   observation at the top, then a rung per inferential link, each rung naming
   the warrant that licensed it, ending in a window that says how many days are
   left.
3. Expand a rung. See the warrant's full text, the preconditions that were
   checked and held, and the defeaters that were checked and *did not fire*.
   The negative check is shown, because "we looked and found nothing that kills
   this" is a different claim from "we did not look".
4. Read the **rejected** pane, which is open by default and is the point of the
   demo. Seven chains died. Three were `blocked` — no warrant in the library
   connects that trigger to any problem this seller solves, and the broken rung
   is drawn with nothing on it. Two were `defeated` — a declared defeater fired,
   and the killing observation is quoted. One is `stale`. One is `unsupported`.
5. **Switch seller.** The same twelve accounts, the same evidence, a different
   set of surviving hypotheses — and for at least one account, zero. Nothing
   about the evidence changed; the relevance link stopped being licensed.
6. **Move the as-of date.** The timeline strip shows every observation as a
   point, every trigger's actionability window as a span, and today as a line.
   Hypotheses become `stale` as their windows close behind the line, and
   ungrey as it moves back.
7. Export. Either the outreach-ready paragraph with numbered evidence
   footnotes, or the full JSON argument tree including every rejected chain and
   the reason it died.
8. Optionally paste real text into the paste panel. With an API key configured,
   it is parsed into typed candidate observations and run through the same
   engine. Without a key, the panel says so and the rest of the app is
   unaffected.

## MVP scope

**In:**

- A warrant library as data: 10 trigger classes, 8 buyer states, 8 problem
  classes, ~11 state→problem warrants, per-seller capability maps, one window
  rule per trigger class, and time-aware defeaters attached to warrants.
- A pure engine that enumerates every candidate chain for (account × seller ×
  as-of) and assigns each exactly one of five verdicts.
- 12 authored accounts on `.example` domains, each carrying a named trap.
- 3 seller profiles, switchable.
- A single-page console: account list, seller toggle, as-of control, timeline
  strip, argument ladders, rejected pane.
- Two exports (text, JSON).
- A paste panel that parses free text into candidate observations via one
  constrained model call, key-optional.
- An invariant sweep over the full cross-product.

**Out (explicitly):**

- Any numeric score. Day 005 ships a scored board; a 0–100 "why-now score" here
  would be fake precision on top of a categorical judgment. A chain stands or it
  is dead with a named reason.
- Character-span citation resolution. That is Day 006 (`account-brief`) and
  re-shipping it would cost half the day for no new idea. Grounding here means
  every node points at a dated observation carrying a quotable excerpt.
- Live web fetching. See *Data sources*.
- Multi-account ranking, feeds, alerting, CRM writeback, persistence, auth.
- Model-authored prose. See decision 13.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zod v4, Vitest,
`@google/genai` for the paste panel only. No database — the corpus is committed
TypeScript and JSON, validated at import. Deployed on Vercel.

Chosen for continuity with Days 001–006 rather than novelty: an unfamiliar stack
on a one-day build spends the budget on setup.

## APIs / data sources

**Authored synthetic corpus.** Every domain ends in `.example`. No real company
is named or quoted. The twelve companies exist to carry twelve specific traps —
each is engineered so that a naive "paste the evidence into a model" build
produces a confident, wrong hypothesis, and this engine does not.

**No live fetching.** A one-day build that fetches arbitrary URLs inherits SSRF
handling it will not do properly, and a demo whose output depends on someone
else's website is a demo that breaks silently. The paste panel is the escape
hatch for real text.

**Model use is confined to parsing.** `@google/genai` is called in exactly one
place: turning pasted prose into typed candidate observations. The engine never
calls it and structurally cannot — see the purity boundary.

## System / architecture

```
                    ┌─ server component ─► data/corpus.ts (Zod-validated at import)
Browser ────────────┤
                    ├─ lib/argument (pure) ─► same function client & server
                    │
                    ├─ POST /api/hypotheses      ─► Zod ─► lib/argument  (auditable JSON)
                    └─ POST /api/parse-observations ─► Zod ─► key check ─► rate limit
                                                        └─ lib/parse (model, one call)
```

The load-bearing structural decision: **`lib/argument/` imports nothing
non-relative** — not `next`, not `react`, not `zod`, not `@google/genai`. A test
scans every file in the directory for bare import specifiers, with no allowlist.

That is not stylistic. A module that cannot import a model client cannot
generate a warrant, so every link in every emitted chain must have come from the
declared library passed in as an argument. There is no code path from model
output to a rendered hypothesis that skips licensing, and `buildHypotheses` is
the only function that assembles one.

The engine is pure and cheap, so the UI runs it in the browser — moving the
as-of date recomputes with no round trip and no spinner. `/api/hypotheses` runs
the *same* function server-side for programmatic use, and an equivalence test
asserts the two produce byte-identical JSON for every account × seller × date in
the sweep.

## Data model

### Observation

What a crawler could have seen, on a date. Nothing is pre-labeled as a signal.

```ts
type SourceGrade = "primary" | "press" | "self_reported";

type Observation = {
  id: string;
  companyId: string;        // subsidiaries have their own id — see trap 6
  kind: ObservationKind;    // ~20 kinds, e.g. exec_arrival, role_filled
  eventDate: string | null; // when it happened; null = undated (trap 7)
  observedAt: string;       // when it was visible
  excerpt: string;          // verbatim, quotable
  source: { title: string; url: string; publisher: string; grade: SourceGrade };
  attributes: Record<string, string | number>; // function, seniority, round, region…
  eventKey?: string;        // three reports of one event share a key (trap 8)
};
```

`eventDate` and `observedAt` are separate because a system may only assert
freshness it can defend. An undated observation cannot anchor a window, which is
what makes trap 7 fatal rather than cosmetic.

### Warrant

The unit of licensing. Warrants are **data**, not code.

```ts
type Warrant = {
  id: string;
  link: "W1" | "W2" | "W3" | "W4";
  from: string;             // trigger class | buyer state | problem
  to: string;               // buyer state | problem | capability
  text: string;             // the human-readable rule
  phrase: string;           // prose template with slots
  preconditions: Precondition[]; // must hold in the evidence
  requiresGrade?: SourceGrade;   // self_reported alone cannot license (trap 4)
  windowDays?: number;      // W1 only: how long the state persists
  defeaters: Defeater[];
};

type Defeater = {
  kind: ObservationKind;     // what kills it
  match?: Precondition[];    // e.g. same function, same role title
  validForDays?: number;     // the defeater itself expires — see trap 10
};
```

A defeater fires only if its observation is dated **after** the trigger and is
itself still within `validForDays`. Both halves matter: a hiring freeze from
before the surge is not a rebuttal, and a certification achieved 400 days ago
does not defeat the next audit cycle.

### Chain and verdict

```ts
type Chain = {
  trigger: Observation;
  links: [Link, Link, Link, Link];  // W1..W4, each licensed or broken
  verdict: "emitted" | "blocked" | "defeated" | "stale" | "unsupported";
  reason: RejectionReason | null;   // names the rung and the evidence
  windowClosesInDays: number | null;
  citations: Observation[];
};
```

### Vocabulary

**10 trigger classes:** `exec_arrival`, `funding_round`, `hiring_surge`,
`role_opened`, `product_launch`, `market_entry`, `compliance_commitment`,
`vendor_migration`, `incident_public`, `headcount_contraction`.

**8 buyer states:** `stack_under_review`, `budget_available`, `ownership_gap`,
`scale_pressure`, `audit_deadline`, `integration_burden`,
`reliability_scrutiny`, `cost_scrutiny`.

**8 problem classes:** `unowned_observability_cost`, `manual_evidence_collection`,
`no_spend_attribution`, `slow_incident_triage`, `fragmented_customer_data`,
`onboarding_latency`, `unmapped_data_residency`, `duplicate_tooling`.

Two problem classes — `fragmented_customer_data` and `onboarding_latency` — are
solved by **no** seller in the library. That is deliberate: it makes trap 1 a
real property of the library rather than an obvious hole, and it means `blocked`
is reachable through a chain that is valid for three rungs and dies on the
fourth.

**3 sellers, 4 capabilities each:** Ledgerline (cloud cost attribution),
Northsignal (incident intelligence), Vaultwright (compliance automation).

## Main states and workflows

Per (account × seller × as-of), every candidate chain lands in exactly one
verdict:

| verdict | meaning | rendered as |
|---|---|---|
| `emitted` | all four links licensed, no defeater fired, window open | full ladder + days remaining |
| `blocked` | no warrant licenses some link | ladder with an empty rung, named |
| `defeated` | a declared defeater fired | ladder with the killing quote inline |
| `stale` | licensed, but the window closed before as-of | greyed ladder + closed date |
| `unsupported` | trigger missing or undated | trigger row + why it cannot anchor |

Emitted chains are ordered by **window tightness** (soonest to close), then
evidence recency. There is no score.

## Implementation task order

Each step is one commit, pushed to `main` immediately.

1. `docs: the plan` — this file.
2. `docs: CLAUDE.md` — thesis, purity boundary, rules that are easy to break.
3. `chore: scaffold Next 16, the type contract, and the purity boundary` —
   app skeleton, `lib/argument/types.ts`, the failing-first purity test.
4. `feat: the warrant library` — vocabulary, ~11 W2 warrants, 12 W1 warrants
   with windows, per-seller W3 maps, time-aware defeaters. Data only.
5. `feat: three sellers, twelve accounts, and the traps each one carries` —
   the corpus, Zod schemas, import-time validation, a test per trap asserting
   the trap is actually present in the data.
6. `feat: chain enumeration, licensing, and the five verdicts` — the core of
   `lib/argument`, with unit tests per verdict.
7. `feat: defeaters, windows, and the identity rules that stop cross-company
   citation` — defeasibility, window arithmetic, subsidiary isolation.
8. `test: the invariant sweep` — the cross-product, ~100k assertions.
9. `feat: the two routes` — validated `/api/hypotheses`, rate-limited
   key-optional `/api/parse-observations`, plus the equivalence test.
10. `feat: the console` — account list, argument ladder, rejected pane.
11. `feat: seller toggle, timeline, as-of control, and both exports`.
12. `docs: README, the plain-English guide, and screenshots`.

## Validation / test plan

**Unit tests** per module: window arithmetic across month boundaries, defeater
timing (fires / does not fire / expired), precondition matching, grade rules,
duplicate collapse by `eventKey`, chain enumeration completeness.

**Trap tests** — one per account, asserting the engineered trap produces the
intended verdict. These are the regression suite that matters: they are the
twelve ways the naive build is wrong.

**Purity test** — scans `lib/argument/**` for bare import specifiers. No
allowlist.

**Equivalence test** — client-side computation and the API route return
byte-identical JSON.

**Invariant sweep** (`npm run sweep`) over 12 accounts × 3 sellers × ~365 as-of
dates × all candidate chains, asserting:

- no `emitted` chain contains a link without a licensing warrant;
- every cited observation is dated on or before the as-of date;
- **monotonicity** — injecting a defeater observation never leaves a chain
  `emitted`;
- determinism — identical inputs produce byte-identical output;
- no chain cites an observation belonging to another company;
- `emitted` implies the as-of date falls inside the window.

Monotonicity is the headline. It is a property a prompt-based build cannot
state, let alone test: there is no sense in which adding a sentence to a prompt
is guaranteed to remove a conclusion.

## Deployment plan

Vercel, `main` auto-deploys. No environment variable is required to run the
bundled demo. `GOOGLE_GENERATIVE_AI_API_KEY` is optional and only enables the
paste panel; its absence is a first-class UI state, not an error.

## README plan

Follows the master structure. Leads with the failure the project exists to kill
("Series B, therefore SOC 2"), shows the rejected pane before the emitted one,
documents the purity boundary and the monotonicity property, and states plainly
that the corpus is authored and synthetic. Screenshots: emitted ladder, blocked
rung, seller-switch comparison. GIF: dragging the as-of line while windows
close.

## Definition of done

- All twelve trap tests pass and each names its trap.
- The sweep passes with a reported assertion count.
- Purity and equivalence tests pass.
- `npm run lint`, `npm run typecheck`, `npm run test` clean.
- Switching seller visibly changes verdicts, including one account that drops to
  zero hypotheses.
- Both exports produce correct output for an emitted and a rejected chain.
- Deployed, live URL in the README.
- README documents what does not work as clearly as what does.

## Post-MVP (not in this build)

- User-editable seller profiles and a warrant editor.
- Warrant backing: citations to why each rule is believed.
- Qualifiers — "presumably", "very likely" — as a declared strength on warrants
  rather than a score.
- Chain composition across two triggers that only license a conclusion jointly.
- A second model call that proposes *candidate* warrants for human review,
  never auto-admitted.

---

## Settled decisions

1. Load-bearing idea is **argument validity**, not signal detection or citation
   grounding — Days 005 and 006 own those.
2. Falsifiability is the gate: every warrant declares what would kill it.
3. Timing windows are a warrant property, not a separate scoring system.
4. Intended user is a rep on **one** account; no list ranking.
5. Evidence primitive is the **dated observation**, not the document.
6. No character-span resolution — excerpts, not spans.
7. Corpus is authored, synthetic, `.example` domains only.
8. Paste panel is the escape hatch for real text; no live fetching.
9. Argument schema is Toulmin, made executable: four links, each warranted.
10. Warrants are **data**, with preconditions and defeaters.
11. Defeaters are **declared**, never model-generated.
12. Defeaters are time-aware: must postdate the trigger, and may expire.
13. Model touches parsing only; all prose comes from warrant templates.
14. Engine is pure: `lib/argument/` imports nothing non-relative, test-enforced.
15. Three seller profiles, switchable; same evidence, different verdicts.
16. Two problem classes are solved by no seller, making `blocked` reachable late
    in a chain.
17. Five verdicts, exactly one per chain.
18. **No numeric score anywhere.**
19. Emitted chains ordered by window tightness, then recency.
20. Rejected chains are co-equal UI, open by default.
21. Twelve accounts, twelve named traps, one test each.
22. As-of control is a date input plus a **timeline strip**, not a reuse of Day
    005's scrubber.
23. Engine runs client-side for instant recompute; the route exists for audit;
    equivalence is tested.
24. Two exports: outreach text with footnotes, and full JSON including
    rejections.
25. Stack matches Days 001–006; no database.
26. One day, feature-frozen at sign-off, ~12 commits, each pushed to `main`.
