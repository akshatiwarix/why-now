import type { Warrant } from "@/lib/argument/types";

/**
 * The warrant library.
 *
 * Warrants are data. Adding an inferential rule means adding a record here —
 * if you find yourself writing `if (trigger.kind === …)` inside
 * `lib/argument/`, the rule belongs in this file instead.
 *
 * W1 licenses trigger → buyer state and owns the actionability window.
 * W2 licenses buyer state → problem.
 * W3 is derived per seller from capability coverage (see `sellers.ts`).
 * W4 re-checks the W1 window against the as-of date.
 */

// ---------------------------------------------------------------------------
// W1 — trigger class → buyer state
// ---------------------------------------------------------------------------

export const W1_WARRANTS: readonly Warrant[] = [
  {
    id: "w1-eng-leader-reopens-stack",
    link: "W1",
    from: "exec_arrival",
    to: "stack_under_review",
    text: "A new senior engineering leader re-opens the stack in their first quarter: the tools they inherit were chosen by someone else, and the first budget cycle they own is the one they change.",
    phrase:
      "{companyName} brought in {personName} as {title} on {triggerDate}, and a new engineering leader re-opens the stack they inherited.",
    preconditions: [
      {
        scope: "trigger",
        test: { attribute: "function", op: "in", value: ["engineering", "platform", "technology"] },
        text: "the arriving executive owns an engineering function",
      },
      {
        scope: "trigger",
        test: { attribute: "seniority", op: "in", value: ["vp", "c_level"] },
        text: "the arrival is at VP level or above",
      },
    ],
    requiresGrade: ["primary", "press"],
    windowDays: 90,
    defeaters: [
      {
        id: "d-eng-leader-left-again",
        kind: "exec_departure",
        match: ["function"],
        text: "the same function lost its leader again after the arrival, so there is no one running the review",
      },
    ],
  },
  {
    id: "w1-finance-leader-scrutinises-cost",
    link: "W1",
    from: "exec_arrival",
    to: "cost_scrutiny",
    text: "A new finance leader audits committed spend before their first full budget, because inherited contracts are the cheapest thing they can be seen to fix.",
    phrase:
      "{companyName} hired {personName} as {title} on {triggerDate}, and an incoming finance leader audits inherited spend before their first budget.",
    preconditions: [
      {
        scope: "trigger",
        test: { attribute: "function", op: "in", value: ["finance"] },
        text: "the arriving executive owns finance",
      },
      {
        scope: "trigger",
        test: { attribute: "seniority", op: "in", value: ["vp", "c_level"] },
        text: "the arrival is at VP level or above",
      },
    ],
    requiresGrade: ["primary", "press"],
    windowDays: 120,
    defeaters: [
      {
        id: "d-finance-leader-left-again",
        kind: "exec_departure",
        match: ["function"],
        text: "the finance function lost its leader again after the arrival",
      },
    ],
  },
  {
    id: "w1-late-round-frees-budget",
    link: "W1",
    from: "funding_round",
    to: "budget_available",
    text: "A round at Series B or later releases discretionary budget that is spent across the following two to three quarters, not on the day it lands.",
    phrase:
      "{companyName} raised its {round} on {triggerDate}, and discretionary budget from a round that size is committed over the following quarters.",
    preconditions: [
      {
        scope: "trigger",
        test: { attribute: "round", op: "in", value: ["series_b", "series_c", "series_d", "growth"] },
        text: "the round is Series B or later",
      },
    ],
    requiresGrade: ["primary", "press"],
    windowDays: 270,
    defeaters: [
      {
        id: "d-round-followed-by-contraction",
        kind: "headcount_contraction",
        validForDays: 365,
        text: "the company contracted after the round, so the budget is no longer discretionary",
      },
    ],
  },
  {
    id: "w1-round-creates-scale-pressure",
    link: "W1",
    from: "funding_round",
    to: "scale_pressure",
    text: "A priced round comes with a growth plan attached, and the plan is what puts load on systems that were sized for the previous stage.",
    phrase:
      "{companyName} raised its {round} on {triggerDate}, and the growth plan attached to it loads systems sized for the previous stage.",
    preconditions: [
      {
        scope: "trigger",
        test: {
          attribute: "round",
          op: "in",
          value: ["series_a", "series_b", "series_c", "series_d", "growth"],
        },
        text: "the round is priced and at Series A or later",
      },
    ],
    requiresGrade: ["primary", "press"],
    windowDays: 180,
    defeaters: [
      {
        id: "d-scale-plan-reversed",
        kind: "headcount_contraction",
        validForDays: 365,
        text: "the company contracted after the round, so the growth plan was withdrawn",
      },
    ],
  },
  {
    id: "w1-hiring-surge-is-scale-pressure",
    link: "W1",
    from: "hiring_surge",
    to: "scale_pressure",
    text: "Five or more concurrent open roles in one function is a staffing plan, and a staffing plan of that size is a bet that current systems will not cope.",
    phrase:
      "{companyName} had {openRoles} concurrent {function} roles open as of {triggerDate}, which is a staffing plan rather than attrition cover.",
    preconditions: [
      {
        scope: "trigger",
        test: { attribute: "function", op: "exists" },
        text: "the surge is attributable to one function",
      },
      {
        scope: "trigger",
        test: { attribute: "openRoles", op: "gte", value: 5 },
        text: "at least five concurrent open roles",
      },
    ],
    requiresGrade: ["primary", "press"],
    windowDays: 120,
    defeaters: [
      {
        id: "d-hiring-frozen",
        kind: "hiring_freeze",
        validForDays: 240,
        text: "a hiring freeze was announced after the surge",
      },
    ],
  },
  {
    id: "w1-open-ownership-role-is-a-gap",
    link: "W1",
    from: "role_opened",
    to: "ownership_gap",
    text: "A role posted with explicit ownership language names a thing nobody currently owns. The posting is the company saying so in public.",
    phrase:
      "{companyName} posted {roleTitle} on {triggerDate}, a role defined by what it would own — which is the company naming something currently unowned.",
    preconditions: [
      {
        scope: "trigger",
        test: { attribute: "ownership", op: "equals", value: "true" },
        text: "the posting is written as an ownership mandate",
      },
    ],
    requiresGrade: ["primary", "press"],
    windowDays: 150,
    defeaters: [
      {
        id: "d-role-filled",
        kind: "role_filled",
        match: ["roleTitle"],
        text: "the role was filled, so the gap is closed",
      },
    ],
  },
  {
    id: "w1-launch-creates-integration-burden",
    link: "W1",
    from: "product_launch",
    to: "integration_burden",
    text: "A launch into a new surface adds systems that have to talk to the ones already there, and the joining work lands after the announcement, not before.",
    phrase:
      "{companyName} launched {productName} on {triggerDate}, and the systems behind a new surface have to be joined to the existing ones.",
    preconditions: [],
    requiresGrade: ["primary", "press"],
    windowDays: 120,
    defeaters: [],
  },
  {
    id: "w1-eu-entry-sets-audit-deadline",
    link: "W1",
    from: "market_entry",
    to: "audit_deadline",
    text: "Entering a European market starts a compliance clock the company did not previously have, and buyers there ask for evidence before they sign.",
    phrase:
      "{companyName} entered {region} on {triggerDate}, which starts a compliance clock it did not previously run against.",
    preconditions: [
      {
        scope: "trigger",
        test: { attribute: "region", op: "in", value: ["eu", "uk", "eea", "germany", "france"] },
        text: "the market entered is in Europe",
      },
    ],
    requiresGrade: ["primary", "press"],
    windowDays: 180,
    defeaters: [],
  },
  {
    id: "w1-commitment-sets-audit-deadline",
    link: "W1",
    from: "compliance_commitment",
    to: "audit_deadline",
    text: "A public commitment to a certification is a dated promise. The work happens between the promise and the audit, which is a window with two ends.",
    phrase:
      "{companyName} committed publicly to {standard} on {triggerDate}, and the work sits between the promise and the audit.",
    preconditions: [],
    requiresGrade: ["primary", "press"],
    windowDays: 270,
    defeaters: [
      {
        id: "d-already-certified",
        kind: "certification_achieved",
        match: ["standard"],
        validForDays: 300,
        text: "the certification was achieved, and the audit cycle it closed has not yet come round again",
      },
    ],
  },
  {
    id: "w1-migration-reopens-stack",
    link: "W1",
    from: "vendor_migration",
    to: "stack_under_review",
    text: "A company that has publicly moved off one vendor has demonstrated both the willingness and the internal approval to move off another.",
    phrase:
      "{companyName} moved off {vendor} on {triggerDate}, which is a demonstrated willingness to change {category} tooling.",
    preconditions: [],
    requiresGrade: ["primary", "press"],
    windowDays: 150,
    defeaters: [
      {
        id: "d-migration-completed",
        kind: "migration_completed",
        match: ["category"],
        text: "the migration completed, closing the review it opened",
      },
    ],
  },
  {
    id: "w1-incident-invites-reliability-scrutiny",
    link: "W1",
    from: "incident_public",
    to: "reliability_scrutiny",
    text: "A public outage puts reliability on an executive agenda for a quarter. A published postmortem with committed remediation takes it off again.",
    phrase:
      "{companyName} had a public {severity} incident on {triggerDate}, which puts reliability on an executive agenda.",
    preconditions: [],
    requiresGrade: ["primary", "press"],
    windowDays: 90,
    defeaters: [
      {
        id: "d-postmortem-closed-it",
        kind: "postmortem_published",
        match: ["severity"],
        validForDays: 60,
        text: "a postmortem with committed remediation was published for that incident, closing the scrutiny it opened — and published recently enough that the closure still holds",
      },
    ],
  },
  {
    id: "w1-contraction-forces-cost-scrutiny",
    link: "W1",
    from: "headcount_contraction",
    to: "cost_scrutiny",
    text: "A contraction is followed by a line-by-line review of committed spend, because headcount is the expensive half and tooling is the half that is easy to cut next.",
    phrase:
      "{companyName} reduced headcount on {triggerDate}, and committed spend is reviewed line by line after a contraction.",
    preconditions: [],
    requiresGrade: ["primary", "press"],
    windowDays: 180,
    defeaters: [
      {
        id: "d-contraction-followed-by-round",
        kind: "funding_round",
        validForDays: 270,
        text: "the company raised after the contraction, so spend is no longer being cut",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// W2 — buyer state → problem class
// ---------------------------------------------------------------------------

export const W2_WARRANTS: readonly Warrant[] = [
  {
    id: "w2-review-surfaces-duplicate-tooling",
    link: "W2",
    from: "stack_under_review",
    to: "duplicate_tooling",
    text: "The first thing a stack review finds is two tools doing one job, because nobody buys a duplicate deliberately — duplicates accumulate between reviews.",
    phrase: "A review of that kind finds overlapping tooling before it finds anything else.",
    preconditions: [],
    defeaters: [],
  },
  {
    id: "w2-review-surfaces-unowned-observability-cost",
    link: "W2",
    from: "stack_under_review",
    to: "unowned_observability_cost",
    text: "Where a company has already changed observability vendors once, the spend is large enough to have been noticed and diffuse enough to have no single owner.",
    phrase:
      "Observability spend is the line item that review reaches next, and here it is large enough to have been noticed already.",
    preconditions: [
      {
        scope: "corpus",
        kind: "vendor_migration",
        withinDays: 540,
        test: { attribute: "category", op: "equals", value: "observability" },
        text: "the company has changed observability vendors in the last 18 months",
      },
    ],
    defeaters: [],
  },
  {
    id: "w2-fresh-budget-exposes-attribution-gap",
    link: "W2",
    from: "budget_available",
    to: "no_spend_attribution",
    text: "New budget is spent on infrastructure the company runs itself, and self-run infrastructure is where spend stops being attributable to the team that caused it.",
    phrase:
      "That budget lands on infrastructure they run themselves, where spend stops being attributable to the team that caused it.",
    preconditions: [
      {
        scope: "corpus",
        kind: "role_opened",
        withinDays: 540,
        test: { attribute: "function", op: "in", value: ["infrastructure", "platform"] },
        text: "the company staffs its own infrastructure",
      },
    ],
    defeaters: [],
  },
  {
    id: "w2-cost-scrutiny-demands-attribution",
    link: "W2",
    from: "cost_scrutiny",
    to: "no_spend_attribution",
    text: "Cost scrutiny fails at the first question — which team caused this line — and a company that cannot answer it cannot cut anything safely.",
    phrase:
      "Scrutiny of that kind stops at the first question: which team caused this line.",
    preconditions: [],
    defeaters: [],
  },
  {
    id: "w2-cost-scrutiny-exposes-observability-spend",
    link: "W2",
    from: "cost_scrutiny",
    to: "unowned_observability_cost",
    text: "Observability is the largest bill nobody signed for, so it is the first one a cost review escalates and the first one with no named owner.",
    phrase:
      "Observability is the largest bill nobody signed for, and it escalates first.",
    preconditions: [
      {
        scope: "corpus",
        kind: "vendor_migration",
        withinDays: 540,
        test: { attribute: "category", op: "equals", value: "observability" },
        text: "the company has changed observability vendors in the last 18 months",
      },
    ],
    defeaters: [],
  },
  {
    id: "w2-ownership-gap-leaves-observability-unowned",
    link: "W2",
    from: "ownership_gap",
    to: "unowned_observability_cost",
    text: "When the unowned mandate is platform or infrastructure, the specific thing left unowned is the shared bill those teams generate on everyone else's behalf.",
    phrase:
      "The thing left unowned in that gap is the shared bill platform work generates on everyone else's behalf.",
    preconditions: [
      {
        scope: "trigger",
        test: { attribute: "function", op: "in", value: ["platform", "infrastructure", "sre"] },
        text: "the unowned mandate is platform, infrastructure or SRE",
      },
    ],
    defeaters: [],
  },
  {
    id: "w2-scale-pressure-slows-triage",
    link: "W2",
    from: "scale_pressure",
    to: "slow_incident_triage",
    text: "Systems grow faster than the knowledge of them. Time-to-cause grows with the number of services and the number of people who have never seen them fail.",
    phrase:
      "Time-to-cause grows with the number of services and the number of people who have not yet seen them fail.",
    preconditions: [],
    defeaters: [],
  },
  {
    id: "w2-scale-pressure-lengthens-onboarding",
    link: "W2",
    from: "scale_pressure",
    to: "onboarding_latency",
    text: "Hiring into a system faster than the system is documented moves the bottleneck to ramp time.",
    phrase: "Hiring outruns documentation, and the bottleneck moves to ramp time.",
    preconditions: [],
    defeaters: [],
  },
  {
    id: "w2-audit-deadline-forces-manual-evidence",
    link: "W2",
    from: "audit_deadline",
    to: "manual_evidence_collection",
    text: "A first audit is met with screenshots and spreadsheets, because nobody instruments controls before they are asked to prove them.",
    phrase:
      "A first audit is met with screenshots and spreadsheets, because controls are not instrumented before someone asks to see them.",
    preconditions: [],
    defeaters: [],
  },
  {
    id: "w2-audit-deadline-raises-residency",
    link: "W2",
    from: "audit_deadline",
    to: "unmapped_data_residency",
    text: "An audit against a European deadline asks where the data physically is, which is a question about infrastructure that nobody has had to answer in writing before.",
    phrase:
      "That audit asks where the data physically sits — a question nobody has had to answer in writing before.",
    preconditions: [
      {
        scope: "corpus",
        kind: "market_entry",
        withinDays: 540,
        test: { attribute: "region", op: "in", value: ["eu", "uk", "eea", "germany", "france"] },
        text: "the company has entered a European market in the last 18 months",
      },
    ],
    defeaters: [],
  },
  {
    id: "w2-reliability-scrutiny-slows-triage",
    link: "W2",
    from: "reliability_scrutiny",
    to: "slow_incident_triage",
    text: "Scrutiny after an outage lands on the number nobody can defend: how long it took to find the cause.",
    phrase:
      "Scrutiny lands on the number nobody can defend — how long it took to find the cause.",
    preconditions: [],
    defeaters: [],
  },
  {
    id: "w2-integration-burden-fragments-customer-data",
    link: "W2",
    from: "integration_burden",
    to: "fragmented_customer_data",
    text: "A new surface writes its own record of the customer before anyone reconciles it with the old one.",
    phrase: "The new surface keeps its own record of the customer.",
    preconditions: [],
    defeaters: [],
  },
];

export const WARRANTS: readonly Warrant[] = [...W1_WARRANTS, ...W2_WARRANTS];
