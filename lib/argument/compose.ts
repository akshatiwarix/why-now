import { formatDate } from "./dates";
import type { Capability, Company, Observation, Warrant, Window } from "./types";

/**
 * Prose.
 *
 * Every rendered sentence is a warrant's `phrase` with slots filled from the
 * trigger's own attributes. No model touches this. The consequence is that the
 * hypothesis cannot read better than the argument the engine licensed — you
 * cannot polish your way past a missing rung, because there is no polishing
 * step.
 */

const SLOT = /\{(\w+)\}/g;

export function fillSlots(
  template: string,
  company: Company,
  trigger: Observation,
): string {
  const values: Record<string, string> = {
    companyName: company.name,
    triggerDate: trigger.eventDate === null ? "an undated page" : formatDate(trigger.eventDate),
  };
  for (const [key, value] of Object.entries(trigger.attributes)) {
    values[key] = String(value);
  }

  return template.replace(SLOT, (whole, name: string) => values[name] ?? whole);
}

export function windowClause(window: Window): string {
  if (window.closesInDays < 0) {
    return `That window closed on ${formatDate(window.closesOn)}.`;
  }
  if (window.closesInDays === 0) {
    return `That window closes today, ${formatDate(window.closesOn)}.`;
  }
  const days = window.closesInDays === 1 ? "1 day" : `${window.closesInDays} days`;
  return `That window closes on ${formatDate(window.closesOn)}, ${days} from now.`;
}

export function composeSentence(input: {
  readonly company: Company;
  readonly trigger: Observation;
  readonly w1: Warrant;
  readonly w2: Warrant;
  readonly capability: Capability;
  readonly window: Window;
}): string {
  return [
    fillSlots(input.w1.phrase, input.company, input.trigger),
    fillSlots(input.w2.phrase, input.company, input.trigger),
    input.capability.phrase,
    windowClause(input.window),
  ].join(" ");
}
