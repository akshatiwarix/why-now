import { daysBetween } from "./dates";
import type { AttributeTest, Observation, Precondition, PreconditionCheck } from "./types";

/**
 * Attribute tests and precondition checking.
 *
 * Everything here compares evidence against a rule that was declared in the
 * warrant library. Nothing infers, and nothing is fuzzy: a test either holds
 * against the attributes actually present or it does not.
 */

function asStrings(value: string | number | readonly (string | number)[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  return [String(value as string | number)];
}

export function testAttributes(
  attributes: Readonly<Record<string, string | number>>,
  test: AttributeTest,
): boolean {
  const actual = attributes[test.attribute];

  switch (test.op) {
    case "exists":
      return actual !== undefined;
    case "equals":
      return actual !== undefined && String(actual) === asStrings(test.value)[0];
    case "in":
      return actual !== undefined && asStrings(test.value).includes(String(actual));
    case "gte": {
      if (actual === undefined) return false;
      const bound = Number(asStrings(test.value)[0]);
      const value = Number(actual);
      return !Number.isNaN(value) && !Number.isNaN(bound) && value >= bound;
    }
  }
}

/**
 * Observations of this company that could have been seen by `asOf`.
 *
 * Both dates gate visibility, and both matter. `eventDate` is when the thing
 * happened; `observedAt` is when anyone could have read about it. An event
 * that had happened but had not yet been reported was not knowable, and a tool
 * that rebuts a hypothesis using tomorrow's article is cheating at its own
 * benchmark. The sweep caught exactly that.
 *
 * Undated observations are excluded — an undated record cannot establish that
 * something was true at a point in time, which is the only reason a
 * precondition consults the corpus at all.
 */
export function visibleObservations(
  observations: readonly Observation[],
  companyId: string,
  asOf: string,
): readonly Observation[] {
  return observations.filter(
    (observation) =>
      observation.companyId === companyId &&
      observation.observedAt <= asOf &&
      observation.eventDate !== null &&
      observation.eventDate <= asOf,
  );
}

export function checkPrecondition(
  precondition: Precondition,
  trigger: Observation,
  observations: readonly Observation[],
  asOf: string,
): PreconditionCheck {
  if (precondition.scope === "trigger") {
    const held = testAttributes(trigger.attributes, precondition.test);
    return { text: precondition.text, held, evidenceId: held ? trigger.id : null };
  }

  const candidates = visibleObservations(observations, trigger.companyId, asOf).filter(
    (observation) => {
      if (observation.kind !== precondition.kind) return false;
      if (precondition.withinDays !== undefined) {
        const age = daysBetween(observation.eventDate as string, asOf);
        if (age > precondition.withinDays) return false;
      }
      if (precondition.test !== undefined) {
        return testAttributes(observation.attributes, precondition.test);
      }
      return true;
    },
  );

  const evidence = candidates[0];
  return {
    text: precondition.text,
    held: evidence !== undefined,
    evidenceId: evidence?.id ?? null,
  };
}

export function checkAll(
  preconditions: readonly Precondition[],
  trigger: Observation,
  observations: readonly Observation[],
  asOf: string,
): readonly PreconditionCheck[] {
  return preconditions.map((precondition) =>
    checkPrecondition(precondition, trigger, observations, asOf),
  );
}
