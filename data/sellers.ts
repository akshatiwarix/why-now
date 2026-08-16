import type { Seller } from "@/lib/argument/types";

/**
 * Three sellers. Same evidence, same warrant library, different verdicts —
 * because W3 (problem → capability) is the only link that depends on who is
 * asking, and it is the link every prompt-based build assumes rather than
 * checks.
 *
 * Two problem classes are solved by nobody here: `fragmented_customer_data`
 * and `onboarding_latency`. That gap is load-bearing. It is what makes
 * `blocked` reachable on the fourth rung of a chain that was valid for three,
 * which is the exact shape of the "Series B, therefore SOC 2" failure.
 */

export const SELLERS: readonly Seller[] = [
  {
    id: "ledgerline",
    name: "Ledgerline",
    category: "cloud cost attribution",
    capabilities: [
      {
        id: "cost_attribution",
        name: "Cost attribution",
        solves: ["no_spend_attribution", "unowned_observability_cost"],
        phrase: "Ledgerline attributes that spend to the team that caused it.",
      },
      {
        id: "budget_alerts",
        name: "Budget alerts",
        solves: ["no_spend_attribution"],
        phrase: "Ledgerline alerts on the line before it becomes the quarter's surprise.",
      },
      {
        id: "chargeback_reports",
        name: "Chargeback reports",
        solves: ["unowned_observability_cost"],
        phrase: "Ledgerline turns the shared bill into a per-team chargeback.",
      },
      {
        id: "commitment_planning",
        name: "Commitment planning",
        solves: ["duplicate_tooling"],
        phrase: "Ledgerline shows what each overlapping contract is actually costing.",
      },
    ],
  },
  {
    id: "northsignal",
    name: "Northsignal",
    category: "incident intelligence",
    capabilities: [
      {
        id: "incident_triage",
        name: "Incident triage",
        solves: ["slow_incident_triage"],
        phrase: "Northsignal cuts time-to-cause by correlating the change that broke it.",
      },
      {
        id: "trace_correlation",
        name: "Trace correlation",
        solves: ["unowned_observability_cost"],
        phrase: "Northsignal shows which traces are generating the bill.",
      },
      {
        id: "slo_management",
        name: "SLO management",
        solves: ["duplicate_tooling"],
        phrase: "Northsignal replaces the overlapping dashboards with one set of objectives.",
      },
      {
        id: "postmortem_automation",
        name: "Postmortem automation",
        solves: ["slow_incident_triage"],
        phrase: "Northsignal assembles the timeline the postmortem needs.",
      },
    ],
  },
  {
    id: "vaultwright",
    name: "Vaultwright",
    category: "compliance automation",
    capabilities: [
      {
        id: "evidence_collection",
        name: "Evidence collection",
        solves: ["manual_evidence_collection"],
        phrase: "Vaultwright collects the evidence continuously instead of in the week before.",
      },
      {
        id: "control_monitoring",
        name: "Control monitoring",
        solves: ["manual_evidence_collection"],
        phrase: "Vaultwright monitors the controls rather than screenshotting them.",
      },
      {
        id: "residency_mapping",
        name: "Residency mapping",
        solves: ["unmapped_data_residency"],
        phrase: "Vaultwright maps where each record physically sits.",
      },
      {
        id: "audit_workspace",
        name: "Audit workspace",
        solves: ["manual_evidence_collection"],
        phrase: "Vaultwright gives the auditor a workspace instead of a shared drive.",
      },
    ],
  },
];

export function sellerById(id: string): Seller | undefined {
  return SELLERS.find((seller) => seller.id === id);
}
