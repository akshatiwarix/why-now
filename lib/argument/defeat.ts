import { daysBetween } from "./dates";
import { visibleObservations } from "./match";
import type { Defeater, FiredDefeater, Observation, Warrant } from "./types";

/**
 * Defeasibility.
 *
 * A defeater fires only when both halves hold:
 *
 *   1. it **postdates the trigger** — a hiring freeze announced before the
 *      surge is not a rebuttal of the surge, it is the thing the surge
 *      reversed; and
 *   2. it is **still inside its own `validForDays`** — a certification
 *      achieved 400 days ago does not close the audit cycle now due, and a
 *      postmortem published four months ago is not still holding executive
 *      scrutiny closed.
 *
 * Dropping either half turns the defeater into a keyword blocklist. Trap 10
 * exists to catch that regression, and the sweep asserts monotonicity on top.
 */

function attributesMatch(
  defeater: Defeater,
  trigger: Observation,
  candidate: Observation,
): boolean {
  if (defeater.match === undefined) return true;
  return defeater.match.every((attribute) => {
    const expected = trigger.attributes[attribute];
    const actual = candidate.attributes[attribute];
    return expected !== undefined && actual !== undefined && String(expected) === String(actual);
  });
}

export function findFiredDefeater(
  warrant: Warrant,
  trigger: Observation,
  observations: readonly Observation[],
  asOf: string,
): FiredDefeater | null {
  if (trigger.eventDate === null) return null;
  const visible = visibleObservations(observations, trigger.companyId, asOf);

  for (const defeater of warrant.defeaters) {
    for (const candidate of visible) {
      if (candidate.kind !== defeater.kind) continue;
      const candidateDate = candidate.eventDate as string;
      if (candidateDate <= trigger.eventDate) continue;
      if (defeater.validForDays !== undefined) {
        if (daysBetween(candidateDate, asOf) > defeater.validForDays) continue;
      }
      if (!attributesMatch(defeater, trigger, candidate)) continue;
      return { defeater, observation: candidate };
    }
  }

  return null;
}

/** Ids of every declared defeater that was checked and did not fire. */
export function clearedDefeaterIds(warrant: Warrant, fired: FiredDefeater | null): readonly string[] {
  return warrant.defeaters
    .filter((defeater) => defeater.id !== fired?.defeater.id)
    .map((defeater) => defeater.id);
}
