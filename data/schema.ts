import { z } from "zod";
import { OBSERVATION_KINDS, SOURCE_GRADES, type ObservationKind } from "@/lib/argument/types";

/**
 * Zod is the trust boundary for everything entering the engine — the committed
 * corpus at import time, and pasted text at request time. The engine itself
 * cannot import Zod (see `lib/argument/purity.test.ts`), so validation happens
 * here, on the way in.
 */

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dates are ISO YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "not a real date");

export const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1),
  grade: z.enum(SOURCE_GRADES),
});

export const observationSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  kind: z.enum(OBSERVATION_KINDS),
  eventDate: isoDate.nullable(),
  observedAt: isoDate,
  excerpt: z.string().min(1),
  source: sourceSchema,
  attributes: z.record(z.string(), z.union([z.string(), z.number()])),
  eventKey: z.string().min(1).optional(),
});

export const companySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().regex(/\.example$/, "every domain in the corpus ends in .example"),
  description: z.string().min(1),
  trap: z.object({
    id: z.number().int().min(1).max(12),
    name: z.string().min(1),
    expectation: z.string().min(1),
  }),
});

/**
 * What each kind must carry for a warrant to be able to test it. A record
 * missing its attributes would fail silently as an unmet precondition, which
 * looks identical to a correctly-rejected chain — so it fails at import
 * instead.
 */
export const REQUIRED_ATTRIBUTES: Record<ObservationKind, readonly string[]> = {
  exec_arrival: ["personName", "title", "function", "seniority"],
  exec_departure: ["personName", "title", "function"],
  funding_round: ["round"],
  hiring_surge: ["function", "openRoles"],
  hiring_freeze: ["function"],
  role_opened: ["roleTitle", "function", "ownership"],
  role_filled: ["roleTitle", "function"],
  product_launch: ["productName"],
  market_entry: ["region"],
  compliance_commitment: ["standard"],
  certification_achieved: ["standard"],
  vendor_migration: ["vendor", "category"],
  migration_completed: ["vendor", "category"],
  incident_public: ["severity"],
  postmortem_published: ["severity"],
  headcount_contraction: ["percent"],
  office_opened: ["region"],
  pricing_change: ["direction"],
  partnership: ["partnerName"],
  customer_win: ["segment"],
};

export type CorpusIssue = { readonly where: string; readonly problem: string };

/**
 * Structural checks Zod cannot express: attribute completeness, referential
 * integrity between observations and companies, and the rule that observations
 * sharing an `eventKey` are reports of one event and must agree about when it
 * happened.
 */
export function validateCorpus(
  companies: readonly z.infer<typeof companySchema>[],
  observations: readonly z.infer<typeof observationSchema>[],
): CorpusIssue[] {
  const issues: CorpusIssue[] = [];

  const ids = new Set<string>();
  for (const observation of observations) {
    if (ids.has(observation.id)) {
      issues.push({ where: observation.id, problem: "duplicate observation id" });
    }
    ids.add(observation.id);

    for (const attribute of REQUIRED_ATTRIBUTES[observation.kind]) {
      if (!(attribute in observation.attributes)) {
        issues.push({
          where: observation.id,
          problem: `${observation.kind} is missing the '${attribute}' attribute`,
        });
      }
    }

    if (observation.eventDate !== null && observation.eventDate > observation.observedAt) {
      issues.push({ where: observation.id, problem: "event dated after it was observed" });
    }
  }

  const referenced = new Set(observations.map((observation) => observation.companyId));
  for (const company of companies) {
    if (!referenced.has(company.id)) {
      issues.push({ where: company.id, problem: "company has no observations" });
    }
  }
  // Observations may reference entities absent from the picker — that is how
  // the subsidiary trap works — so unreferenced companyIds are not an error.

  const byKey = new Map<string, Set<string>>();
  for (const observation of observations) {
    if (observation.eventKey === undefined) continue;
    const dates = byKey.get(observation.eventKey) ?? new Set<string>();
    dates.add(observation.eventDate ?? "undated");
    byKey.set(observation.eventKey, dates);
  }
  for (const [key, dates] of byKey) {
    if (dates.size > 1) {
      issues.push({
        where: key,
        problem: `reports of one event disagree about its date: ${[...dates].join(", ")}`,
      });
    }
  }

  const trapIds = companies.map((company) => company.trap.id).sort((a, b) => a - b);
  const expected = Array.from({ length: companies.length }, (_, index) => index + 1);
  if (trapIds.join(",") !== expected.join(",")) {
    issues.push({ where: "corpus", problem: `trap ids are not 1..${companies.length}` });
  }

  return issues;
}
