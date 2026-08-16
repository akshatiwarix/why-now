import type { Observation, TriggerKind } from "./types";
import { TRIGGER_KINDS } from "./types";

/**
 * Turning a pile of observations into the set of things a chain may start
 * from.
 *
 * Two rules do the work. Only ten kinds are trigger kinds — `exec_departure`
 * is evidence, but nothing starts from it. And observations sharing an
 * `eventKey` are three outlets covering one event, which is **one** trigger:
 * the extra reports become citations, not additional arguments. Skipping that
 * collapse is how a corpus comes to look three times as strong as it is.
 */

export type TriggerGroup = {
  readonly representative: Observation;
  /** Every report of this event, representative first. Rendered as citations. */
  readonly reports: readonly Observation[];
};

function isTriggerKind(kind: string): kind is TriggerKind {
  return (TRIGGER_KINDS as readonly string[]).includes(kind);
}

export function collapseTriggers(
  observations: readonly Observation[],
  companyId: string,
  asOf: string,
): readonly TriggerGroup[] {
  const visible = observations
    .filter((observation) => observation.companyId === companyId)
    .filter((observation) => isTriggerKind(observation.kind))
    .filter((observation) => observation.observedAt <= asOf)
    .filter((observation) => observation.eventDate === null || observation.eventDate <= asOf);

  const groups = new Map<string, Observation[]>();
  for (const observation of visible) {
    const key = observation.eventKey ?? `id:${observation.id}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(observation);
    groups.set(key, bucket);
  }

  return [...groups.values()]
    .map((bucket) => {
      const reports = [...bucket].sort((a, b) => a.id.localeCompare(b.id));
      // The representative is stable and does not depend on Map iteration
      // order, because the sweep asserts byte-identical output.
      const representative = reports[0] as Observation;
      return { representative, reports };
    })
    .sort((a, b) => a.representative.id.localeCompare(b.representative.id));
}
