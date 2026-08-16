import { composeSentence } from "./compose";
import { addDays, daysBetween } from "./dates";
import { clearedDefeaterIds, findFiredDefeater } from "./defeat";
import { collapseTriggers } from "./enumerate";
import { checkAll } from "./match";
import type {
  BuildInput,
  Capability,
  Chain,
  Company,
  HypothesisReport,
  Link,
  Observation,
  PreconditionCheck,
  Seller,
  Verdict,
  Warrant,
  Window,
} from "./types";
import { VERDICTS } from "./types";

/**
 * `buildHypotheses` is the only exported entry point to the engine. Route
 * handlers and components must not reach into `license`, `defeat` or
 * `compose` directly — every verdict in the product comes through here, which
 * is what makes the licensing rules unbypassable.
 */

type Failure = { readonly verdict: Verdict; readonly link: Link["id"]; readonly detail: string; readonly evidenceId: string | null };

const REJECTED_ORDER: readonly Verdict[] = ["defeated", "blocked", "stale", "unsupported"];

function firstUnmet(checks: readonly PreconditionCheck[]): PreconditionCheck | undefined {
  return checks.find((check) => !check.held);
}

function gradeList(warrant: Warrant): string {
  return (warrant.requiresGrade ?? []).join(" or ").replace(/_/g, "-");
}

function capabilityFor(seller: Seller, problem: string): Capability | undefined {
  return seller.capabilities.find((capability) =>
    (capability.solves as readonly string[]).includes(problem),
  );
}

/**
 * Applicability is not the same as licensing.
 *
 * A warrant's `trigger`-scope preconditions say **which triggers it is about**
 * — the finance-hire warrant is not about an engineering hire, and reporting
 * that as a `blocked` chain would fill the rejected pane with arguments nobody
 * was making. Those warrants are skipped before enumeration.
 *
 * `corpus`-scope preconditions are different: the warrant *is* about this
 * trigger, and the supporting evidence it needs is absent. That is a genuine
 * rejection, and it is what trap 11 turns on.
 */
function applies(
  warrant: Warrant,
  trigger: Observation,
  observations: readonly Observation[],
  asOf: string,
): boolean {
  const triggerScoped = warrant.preconditions.filter(
    (precondition) => precondition.scope === "trigger",
  );
  return checkAll(triggerScoped, trigger, observations, asOf).every((check) => check.held);
}

function evaluateChain(input: {
  readonly company: Company;
  readonly seller: Seller;
  readonly observations: readonly Observation[];
  readonly asOf: string;
  readonly trigger: Observation;
  readonly reports: readonly Observation[];
  readonly w1: Warrant;
  readonly w2: Warrant;
}): Chain {
  const { company, seller, observations, asOf, trigger, reports, w1, w2 } = input;
  const failures: Failure[] = [];

  // --- W1: trigger → buyer state -------------------------------------------
  const w1Checks = checkAll(w1.preconditions, trigger, observations, asOf);
  const w1Fired = findFiredDefeater(w1, trigger, observations, asOf);
  const gradeOk =
    w1.requiresGrade === undefined ||
    (w1.requiresGrade as readonly string[]).includes(trigger.source.grade);
  const unmet1 = firstUnmet(w1Checks);

  let w1Status: Link["status"] = "licensed";
  let w1Detail = w1.text;

  if (trigger.eventDate === null) {
    w1Status = "unlicensed";
    w1Detail =
      "The trigger is undated, so nothing here establishes when the state began — and a window cannot be anchored to a guess.";
    failures.push({ verdict: "unsupported", link: "W1", detail: w1Detail, evidenceId: trigger.id });
  } else if (!gradeOk) {
    w1Status = "unlicensed";
    w1Detail = `This warrant requires ${gradeList(w1)} evidence; the only source is ${trigger.source.grade.replace(/_/g, "-")} (${trigger.source.publisher}).`;
    failures.push({ verdict: "blocked", link: "W1", detail: w1Detail, evidenceId: trigger.id });
  } else if (unmet1 !== undefined) {
    w1Status = "unlicensed";
    w1Detail = `Unmet precondition: ${unmet1.text}.`;
    failures.push({ verdict: "blocked", link: "W1", detail: w1Detail, evidenceId: null });
  } else if (w1Fired !== null) {
    w1Status = "defeated";
    w1Detail = `Defeated: ${w1Fired.defeater.text}.`;
    failures.push({
      verdict: "defeated",
      link: "W1",
      detail: w1Detail,
      evidenceId: w1Fired.observation.id,
    });
  }

  const w1Link: Link = {
    id: "W1",
    from: w1.from,
    to: w1.to,
    label: "Buyer state",
    warrant: w1,
    status: w1Status,
    detail: w1Detail,
    preconditionChecks: w1Checks,
    clearedDefeaters: clearedDefeaterIds(w1, w1Fired),
    firedDefeater: w1Status === "defeated" ? w1Fired : null,
  };

  // --- W2: buyer state → problem -------------------------------------------
  const w2Checks = checkAll(w2.preconditions, trigger, observations, asOf);
  const w2Fired = findFiredDefeater(w2, trigger, observations, asOf);
  const unmet2 = firstUnmet(w2Checks);

  let w2Status: Link["status"] = "licensed";
  let w2Detail = w2.text;

  if (unmet2 !== undefined) {
    w2Status = "unlicensed";
    w2Detail = `Unmet precondition: ${unmet2.text}.`;
    failures.push({ verdict: "blocked", link: "W2", detail: w2Detail, evidenceId: null });
  } else if (w2Fired !== null) {
    w2Status = "defeated";
    w2Detail = `Defeated: ${w2Fired.defeater.text}.`;
    failures.push({
      verdict: "defeated",
      link: "W2",
      detail: w2Detail,
      evidenceId: w2Fired.observation.id,
    });
  }

  const w2Link: Link = {
    id: "W2",
    from: w2.from,
    to: w2.to,
    label: "Problem",
    warrant: w2,
    status: w2Status,
    detail: w2Detail,
    preconditionChecks: w2Checks,
    clearedDefeaters: clearedDefeaterIds(w2, w2Fired),
    firedDefeater: w2Status === "defeated" ? w2Fired : null,
  };

  // --- W3: problem → capability --------------------------------------------
  const capability = capabilityFor(seller, w2.to);
  const w3Licensed = capability !== undefined;
  if (!w3Licensed) {
    failures.push({
      verdict: "blocked",
      link: "W3",
      detail: `${seller.name} has no capability that addresses ${w2.to.replace(/_/g, " ")}.`,
      evidenceId: null,
    });
  }

  const w3Link: Link = {
    id: "W3",
    from: w2.to,
    to: capability?.id ?? "—",
    label: "Relevance",
    warrant: null,
    status: w3Licensed ? "licensed" : "unlicensed",
    detail: w3Licensed
      ? `${seller.name} — ${capability.name} addresses ${w2.to.replace(/_/g, " ")}.`
      : `${seller.name} has no capability that addresses ${w2.to.replace(/_/g, " ")}. The chain is valid up to here and stops.`,
    preconditionChecks: [],
    clearedDefeaters: [],
    firedDefeater: null,
  };

  // --- W4: the window -------------------------------------------------------
  let window: Window | null = null;
  let w4Status: Link["status"] = "licensed";
  let w4Detail = "";

  if (trigger.eventDate === null || w1.windowDays === undefined) {
    w4Status = "unlicensed";
    w4Detail = "No dated trigger, so there is no window to be inside.";
  } else {
    const closesOn = addDays(trigger.eventDate, w1.windowDays);
    window = {
      opensOn: trigger.eventDate,
      closesOn,
      closesInDays: daysBetween(asOf, closesOn),
    };
    if (window.closesInDays < 0) {
      w4Status = "closed";
      w4Detail = `The window ran ${w1.windowDays} days from ${trigger.eventDate} and closed on ${closesOn}.`;
      failures.push({ verdict: "stale", link: "W4", detail: w4Detail, evidenceId: trigger.id });
    } else {
      w4Detail = `${w1.windowDays} days from ${trigger.eventDate}; ${window.closesInDays} left.`;
    }
  }

  const w4Link: Link = {
    id: "W4",
    from: capability?.id ?? w2.to,
    to: "why now",
    label: "Timing",
    warrant: null,
    status: w4Status,
    detail: w4Detail,
    preconditionChecks: [],
    clearedDefeaters: [],
    firedDefeater: null,
  };

  // --- Verdict --------------------------------------------------------------
  // Failures are reported in link order: the earliest broken rung is the
  // reason, because everything downstream of it was never licensed to run.
  const failure = failures[0] ?? null;
  const verdict: Verdict = failure?.verdict ?? "emitted";

  const citations: Observation[] = [...reports];
  for (const check of [...w1Checks, ...w2Checks]) {
    if (!check.held || check.evidenceId === null) continue;
    const evidence = observations.find((observation) => observation.id === check.evidenceId);
    if (evidence !== undefined && !citations.some((c) => c.id === evidence.id)) {
      citations.push(evidence);
    }
  }
  for (const fired of [w1Fired, w2Fired]) {
    if (fired === null) continue;
    if (!citations.some((c) => c.id === fired.observation.id)) citations.push(fired.observation);
  }

  const sentence =
    verdict === "emitted" && capability !== undefined && window !== null
      ? composeSentence({ company, trigger, w1, w2, capability, window })
      : null;

  return {
    id: `${company.id}:${seller.id}:${trigger.id}:${w1.id}:${w2.id}`,
    companyId: company.id,
    sellerId: seller.id,
    trigger,
    links: [w1Link, w2Link, w3Link, w4Link],
    verdict,
    reason:
      failure === null
        ? null
        : { link: failure.link, detail: failure.detail, evidenceId: failure.evidenceId },
    window,
    citations,
    sentence,
  };
}

export function buildHypotheses(input: BuildInput): HypothesisReport {
  const { company, observations, warrants, seller, asOf } = input;

  const w1Warrants = warrants.filter((warrant) => warrant.link === "W1");
  const w2Warrants = warrants.filter((warrant) => warrant.link === "W2");

  const chains: Chain[] = [];
  for (const group of collapseTriggers(observations, company.id, asOf)) {
    const trigger = group.representative;
    for (const w1 of w1Warrants) {
      if (w1.from !== trigger.kind) continue;
      if (!applies(w1, trigger, observations, asOf)) continue;
      for (const w2 of w2Warrants) {
        if (w2.from !== w1.to) continue;
        if (!applies(w2, trigger, observations, asOf)) continue;
        chains.push(
          evaluateChain({
            company,
            seller,
            observations,
            asOf,
            trigger,
            reports: group.reports,
            w1,
            w2,
          }),
        );
      }
    }
  }

  const emitted = chains
    .filter((chain) => chain.verdict === "emitted")
    .sort((a, b) => {
      const byWindow = (a.window?.closesInDays ?? 0) - (b.window?.closesInDays ?? 0);
      if (byWindow !== 0) return byWindow;
      const byDate = (b.trigger.eventDate ?? "").localeCompare(a.trigger.eventDate ?? "");
      if (byDate !== 0) return byDate;
      return a.id.localeCompare(b.id);
    });

  const rejected = chains
    .filter((chain) => chain.verdict !== "emitted")
    .sort((a, b) => {
      const byVerdict =
        REJECTED_ORDER.indexOf(a.verdict) - REJECTED_ORDER.indexOf(b.verdict);
      if (byVerdict !== 0) return byVerdict;
      const byDate = (b.trigger.eventDate ?? "").localeCompare(a.trigger.eventDate ?? "");
      if (byDate !== 0) return byDate;
      return a.id.localeCompare(b.id);
    });

  const counts = Object.fromEntries(
    VERDICTS.map((verdict) => [verdict, chains.filter((c) => c.verdict === verdict).length]),
  ) as Record<Verdict, number>;

  return { companyId: company.id, sellerId: seller.id, asOf, emitted, rejected, counts };
}

export type { BuildInput, Chain, HypothesisReport } from "./types";
