/**
 * The type contract for the argument engine.
 *
 * This file imports nothing — not even a type. `purity.test.ts` enforces that
 * across the whole of `lib/argument/`, because a module that cannot import a
 * model client cannot invent a warrant.
 */

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

/**
 * Who is speaking. `self_reported` is the company describing itself, which is
 * marketing copy no matter how factual it sounds — warrants may refuse it.
 */
export const SOURCE_GRADES = ["primary", "press", "self_reported"] as const;
export type SourceGrade = (typeof SOURCE_GRADES)[number];

/**
 * Everything a crawler could have seen. Nothing here is labelled as a signal:
 * `exec_departure` is as much an observation as `exec_arrival`, and which of
 * them is evidence and which is a rebuttal is decided by the warrant library,
 * not by the corpus.
 */
export const OBSERVATION_KINDS = [
  "exec_arrival",
  "exec_departure",
  "funding_round",
  "hiring_surge",
  "hiring_freeze",
  "role_opened",
  "role_filled",
  "product_launch",
  "market_entry",
  "compliance_commitment",
  "certification_achieved",
  "vendor_migration",
  "migration_completed",
  "incident_public",
  "postmortem_published",
  "headcount_contraction",
  "office_opened",
  "pricing_change",
  "partnership",
  "customer_win",
] as const;
export type ObservationKind = (typeof OBSERVATION_KINDS)[number];

/** The ten kinds a chain is allowed to start from. */
export const TRIGGER_KINDS = [
  "exec_arrival",
  "funding_round",
  "hiring_surge",
  "role_opened",
  "product_launch",
  "market_entry",
  "compliance_commitment",
  "vendor_migration",
  "incident_public",
  "headcount_contraction",
] as const;
export type TriggerKind = (typeof TRIGGER_KINDS)[number];

export type Source = {
  readonly title: string;
  readonly url: string;
  readonly publisher: string;
  readonly grade: SourceGrade;
};

export type Observation = {
  readonly id: string;
  /** Subsidiaries carry their own id. A chain may never cross companies. */
  readonly companyId: string;
  readonly kind: ObservationKind;
  /**
   * When the event happened, if the source says. `null` means undated, and an
   * undated observation cannot anchor a window — which is the whole of the
   * `unsupported` verdict.
   */
  readonly eventDate: string | null;
  /** When the text was visible. Always known; never a substitute for eventDate. */
  readonly observedAt: string;
  /** Verbatim, quotable. Rendered next to any link that rests on it. */
  readonly excerpt: string;
  readonly source: Source;
  readonly attributes: Readonly<Record<string, string | number>>;
  /** Three reports of one event share a key and collapse to one trigger. */
  readonly eventKey?: string;
};

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const BUYER_STATES = [
  "stack_under_review",
  "budget_available",
  "ownership_gap",
  "scale_pressure",
  "audit_deadline",
  "integration_burden",
  "reliability_scrutiny",
  "cost_scrutiny",
] as const;
export type BuyerState = (typeof BUYER_STATES)[number];

/**
 * `fragmented_customer_data` and `onboarding_latency` are solved by no seller
 * in the library. That is deliberate: it makes `blocked` reachable on the
 * fourth rung of an otherwise valid chain.
 */
export const PROBLEM_CLASSES = [
  "unowned_observability_cost",
  "manual_evidence_collection",
  "no_spend_attribution",
  "slow_incident_triage",
  "fragmented_customer_data",
  "onboarding_latency",
  "unmapped_data_residency",
  "duplicate_tooling",
] as const;
export type ProblemClass = (typeof PROBLEM_CLASSES)[number];

// ---------------------------------------------------------------------------
// Warrants
// ---------------------------------------------------------------------------

/** W1 trigger→state, W2 state→problem, W3 problem→capability, W4 the window. */
export const LINK_IDS = ["W1", "W2", "W3", "W4"] as const;
export type LinkId = (typeof LINK_IDS)[number];

export type AttributeTest = {
  readonly attribute: string;
  readonly op: "equals" | "in" | "gte" | "exists";
  readonly value?: string | number | readonly (string | number)[];
};

/**
 * A condition that must hold in the evidence for a warrant to apply.
 * `trigger` tests the triggering observation; `corpus` asserts some other
 * observation exists for the same company, optionally within a window.
 */
export type Precondition =
  | { readonly scope: "trigger"; readonly test: AttributeTest; readonly text: string }
  | {
      readonly scope: "corpus";
      readonly kind: ObservationKind;
      readonly withinDays?: number;
      readonly test?: AttributeTest;
      readonly text: string;
    };

/**
 * Declared, never generated. A defeater fires only when its observation
 * postdates the trigger AND is itself still inside `validForDays` — both
 * halves matter, and trap 10 exists to catch a regression in the second.
 */
export type Defeater = {
  readonly id: string;
  readonly kind: ObservationKind;
  /** Attribute names that must match the trigger's, e.g. `function`, `roleTitle`. */
  readonly match?: readonly string[];
  readonly validForDays?: number;
  readonly text: string;
};

export type Warrant = {
  readonly id: string;
  readonly link: LinkId;
  readonly from: string;
  readonly to: string;
  /** The rule in plain English, shown when a rung is expanded. */
  readonly text: string;
  /** Prose template. Slots are `{name}`, filled from trigger attributes. */
  readonly phrase: string;
  readonly preconditions: readonly Precondition[];
  /** If set, the trigger's source grade must be one of these. */
  readonly requiresGrade?: readonly SourceGrade[];
  /** W1 only: how many days the buyer state persists after the event. */
  readonly windowDays?: number;
  readonly defeaters: readonly Defeater[];
};

// ---------------------------------------------------------------------------
// Sellers
// ---------------------------------------------------------------------------

export type Capability = {
  readonly id: string;
  readonly name: string;
  readonly solves: readonly ProblemClass[];
  /** Prose template for the relevance rung. */
  readonly phrase: string;
};

export type Seller = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly capabilities: readonly Capability[];
};

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export type Company = {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly description: string;
  /** The engineered failure this account exists to catch. */
  readonly trap: { readonly id: number; readonly name: string; readonly expectation: string };
};

// ---------------------------------------------------------------------------
// Chains and verdicts
// ---------------------------------------------------------------------------

export const VERDICTS = ["emitted", "blocked", "defeated", "stale", "unsupported"] as const;
export type Verdict = (typeof VERDICTS)[number];

export type FiredDefeater = {
  readonly defeater: Defeater;
  readonly observation: Observation;
};

export type PreconditionCheck = {
  readonly text: string;
  readonly held: boolean;
  readonly evidenceId: string | null;
};

export type Link = {
  readonly id: LinkId;
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly warrant: Warrant | null;
  readonly status: "licensed" | "unlicensed" | "defeated" | "closed";
  readonly detail: string;
  readonly preconditionChecks: readonly PreconditionCheck[];
  /** Defeaters that were checked and did **not** fire. Rendered; not debug. */
  readonly clearedDefeaters: readonly string[];
  readonly firedDefeater: FiredDefeater | null;
};

export type Window = {
  readonly opensOn: string;
  readonly closesOn: string;
  /** Negative once the window has closed behind the as-of date. */
  readonly closesInDays: number;
};

export type RejectionReason = {
  readonly link: LinkId | null;
  readonly detail: string;
  readonly evidenceId: string | null;
};

export type Chain = {
  readonly id: string;
  readonly companyId: string;
  readonly sellerId: string;
  readonly trigger: Observation;
  /** Always four, in W1..W4 order, whatever the verdict. */
  readonly links: readonly Link[];
  readonly verdict: Verdict;
  readonly reason: RejectionReason | null;
  readonly window: Window | null;
  readonly citations: readonly Observation[];
  /** Composed from warrant phrase templates. Non-null only when emitted. */
  readonly sentence: string | null;
};

export type HypothesisReport = {
  readonly companyId: string;
  readonly sellerId: string;
  readonly asOf: string;
  /** Ordered by window tightness, then evidence recency. There is no score. */
  readonly emitted: readonly Chain[];
  readonly rejected: readonly Chain[];
  readonly counts: Readonly<Record<Verdict, number>>;
};

export type BuildInput = {
  readonly company: Company;
  readonly observations: readonly Observation[];
  readonly warrants: readonly Warrant[];
  readonly seller: Seller;
  readonly asOf: string;
};
