import type { Company, Observation, ObservationKind, Seller, SourceGrade, Warrant } from "./types";

/** Fixture builders. Pure, relative-import-only, like everything else here. */

export function observation(
  overrides: Partial<Observation> & { readonly id: string; readonly kind: ObservationKind },
): Observation {
  const grade: SourceGrade = overrides.source?.grade ?? "press";
  return {
    companyId: "acme",
    eventDate: "2026-06-01",
    observedAt: overrides.eventDate ?? "2026-06-01",
    excerpt: `an excerpt for ${overrides.id}`,
    attributes: {},
    ...overrides,
    source: overrides.source ?? {
      title: `report ${overrides.id}`,
      url: `https://press.example/${overrides.id}`,
      publisher: "Press Example",
      grade,
    },
  };
}

export function company(overrides: Partial<Company> = {}): Company {
  return {
    id: "acme",
    name: "Acme",
    domain: "acme.example",
    description: "A fixture.",
    trap: { id: 1, name: "fixture", expectation: "none" },
    ...overrides,
  };
}

export function seller(overrides: Partial<Seller> = {}): Seller {
  return {
    id: "testco",
    name: "Testco",
    category: "fixtures",
    capabilities: [
      {
        id: "fixing",
        name: "Fixing",
        solves: ["duplicate_tooling"],
        phrase: "Testco fixes it.",
      },
    ],
    ...overrides,
  };
}

export function warrant(overrides: Partial<Warrant> & { readonly id: string }): Warrant {
  return {
    link: "W1",
    from: "exec_arrival",
    to: "stack_under_review",
    text: "a rule",
    phrase: "{companyName} did a thing on {triggerDate}.",
    preconditions: [],
    defeaters: [],
    ...overrides,
  };
}
