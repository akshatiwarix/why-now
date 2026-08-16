import type { Company, Observation } from "@/lib/argument/types";
import { companySchema, observationSchema, validateCorpus } from "./schema";

/**
 * An authored, synthetic corpus. Every domain ends in `.example`, no real
 * company is named or quoted, and the twelve accounts exist to carry twelve
 * specific traps — each engineered so that pasting the evidence into a model
 * produces a confident, wrong hypothesis.
 *
 * Dates are fixed rather than relative so that a reviewer running this in a
 * year sees the same verdicts. `DEFAULT_AS_OF` is the date the corpus was
 * authored against; move it with the as-of control.
 */

export const DEFAULT_AS_OF = "2026-08-16";

const RAW_COMPANIES: Company[] = [
  {
    id: "northwind-freight",
    name: "Northwind Freight",
    domain: "northwind-freight.example",
    description: "Regional freight brokerage, 480 staff.",
    trap: {
      id: 1,
      name: "the unwarranted leap",
      expectation:
        "A Series C and a product launch, and for a cost-attribution seller every single chain still dies on relevance. Loud evidence is not a reason.",
    },
  },
  {
    id: "calder-health",
    name: "Calder Health",
    domain: "calderhealth.example",
    description: "Clinical scheduling software for hospital groups.",
    trap: {
      id: 2,
      name: "the defeater in the same corpus",
      expectation:
        "The engineering leader whose arrival powers the hypothesis left again six weeks later. The evidence that kills it was always in the file.",
    },
  },
  {
    id: "orbis-retail",
    name: "Orbis Retail",
    domain: "orbis-retail.example",
    description: "Own-brand grocery retailer with an in-house platform team.",
    trap: {
      id: 3,
      name: "the window that closed",
      expectation:
        "The round was fourteen months ago. The chain is perfectly valid and the moment has passed — 'now' is computed, not asserted.",
    },
  },
  {
    id: "halberd-systems",
    name: "Halberd Systems",
    domain: "halberd-systems.example",
    description: "Industrial automation vendor moving into software.",
    trap: {
      id: 4,
      name: "the company quoting itself",
      expectation:
        "Every trigger here is the company's own blog. Marketing copy about a company is written by that company, and cannot license a warrant that demands independent evidence.",
    },
  },
  {
    id: "vireo-labs",
    name: "Vireo Labs",
    domain: "vireo-labs.example",
    description: "Bioinformatics platform for contract research organisations.",
    trap: {
      id: 5,
      name: "the contradiction that runs one way",
      expectation:
        "They raised in April and contracted in June. The round no longer means budget; the contraction does mean cost scrutiny. Order decides which of the two survives.",
    },
  },
  {
    id: "pell-and-roe",
    name: "Pell & Roe",
    domain: "pell-and-roe.example",
    description: "Insurance brokerage with a separately-run analytics subsidiary.",
    trap: {
      id: 6,
      name: "the subsidiary's evidence",
      expectation:
        "The observability migration belongs to Pell Analytics, a different legal entity. A chain may not cross companies, however similar the names.",
    },
  },
  {
    id: "kestrel-grid",
    name: "Kestrel Grid",
    domain: "kestrel-grid.example",
    description: "Grid-balancing software for regional utilities.",
    trap: {
      id: 7,
      name: "the undated arrival",
      expectation:
        "A leadership page with no date. It may well be recent; nothing here says so, and a window cannot be anchored to a guess.",
    },
  },
  {
    id: "mordant-foods",
    name: "Mordant Foods",
    domain: "mordant-foods.example",
    description: "Direct-to-consumer food brand with an in-house platform.",
    trap: {
      id: 8,
      name: "one event, three headlines",
      expectation:
        "Three outlets covered one funding round. It is one trigger. A corpus that looks three times as rich is the oldest way to overstate a case.",
    },
  },
  {
    id: "sable-freightways",
    name: "Sable Freightways",
    domain: "sable-freightways.example",
    description: "Cross-border logistics operator expanding into the EU.",
    trap: {
      id: 9,
      name: "the seller-dependent verdict",
      expectation:
        "Identical evidence. For a compliance seller, two live hypotheses; for a cost seller, nothing at all. Relevance is a link that has to be checked.",
    },
  },
  {
    id: "ferrous-logic",
    name: "Ferrous Logic",
    domain: "ferrous-logic.example",
    description: "Payments infrastructure for industrial marketplaces.",
    trap: {
      id: 10,
      name: "the defeater that expired",
      expectation:
        "Two outages, two postmortems. The May postmortem is too old to still be closing anything; the July one is not. A defeater is not a keyword — it has an age.",
    },
  },
  {
    id: "auric-ledger",
    name: "Auric Ledger",
    domain: "auric-ledger.example",
    description: "Treasury management for mid-market finance teams.",
    trap: {
      id: 11,
      name: "the missing precondition",
      expectation:
        "The strong story — a new VP finds unowned observability spend — needs evidence this company has such spend. It does not exist. The weaker, licensed story is what ships.",
    },
  },
  {
    id: "tessellate",
    name: "Tessellate",
    domain: "tessellate.example",
    description: "Warehouse robotics fleet management.",
    trap: {
      id: 12,
      name: "the positive control",
      expectation:
        "Everything lines up: dated, independent, preconditions met, windows open, nothing rebutting. If this account stops emitting, the engine broke.",
    },
  },
];

const RAW_OBSERVATIONS: Observation[] = [
  // -- 1. Northwind Freight — the unwarranted leap ---------------------------
  {
    id: "nw-1",
    companyId: "northwind-freight",
    kind: "funding_round",
    eventDate: "2026-06-10",
    observedAt: "2026-06-10",
    excerpt:
      "Northwind Freight has closed a $60m Series C led by Harrowgate Partners, bringing total funding to $104m.",
    source: {
      title: "Northwind Freight closes $60m Series C",
      url: "https://logisticswire.example/northwind-series-c",
      publisher: "Logistics Wire",
      grade: "press",
    },
    attributes: { round: "series_c", amountUsdM: 60 },
  },
  {
    id: "nw-2",
    companyId: "northwind-freight",
    kind: "product_launch",
    eventDate: "2026-06-20",
    observedAt: "2026-06-21",
    excerpt:
      "The company introduced Northwind Dispatch, a carrier-facing scheduling product sold separately from its brokerage service.",
    source: {
      title: "Northwind adds carrier-side product",
      url: "https://logisticswire.example/northwind-dispatch",
      publisher: "Logistics Wire",
      grade: "press",
    },
    attributes: { productName: "Northwind Dispatch" },
  },
  {
    id: "nw-3",
    companyId: "northwind-freight",
    kind: "partnership",
    eventDate: "2026-05-02",
    observedAt: "2026-05-02",
    excerpt: "Northwind Freight named Cargolink as a preferred cross-dock partner for the Midwest.",
    source: {
      title: "Cargolink and Northwind sign Midwest agreement",
      url: "https://logisticswire.example/northwind-cargolink",
      publisher: "Logistics Wire",
      grade: "press",
    },
    attributes: { partnerName: "Cargolink" },
  },

  // -- 2. Calder Health — the defeater in the same corpus --------------------
  {
    id: "ch-1",
    companyId: "calder-health",
    kind: "exec_arrival",
    eventDate: "2026-06-04",
    observedAt: "2026-06-05",
    excerpt:
      "Calder Health has appointed Ilse Brandt as VP Engineering, joining from a clinical imaging vendor.",
    source: {
      title: "Calder Health names VP Engineering",
      url: "https://healthtechdaily.example/calder-vp-eng",
      publisher: "Health Tech Daily",
      grade: "press",
    },
    attributes: {
      personName: "Ilse Brandt",
      title: "VP Engineering",
      function: "engineering",
      seniority: "vp",
    },
  },
  {
    id: "ch-2",
    companyId: "calder-health",
    kind: "vendor_migration",
    eventDate: "2025-11-02",
    observedAt: "2025-11-04",
    excerpt:
      "Calder Health confirmed it has moved its monitoring and log storage off Meterloop following a contract review.",
    source: {
      title: "Calder Health drops Meterloop",
      url: "https://healthtechdaily.example/calder-meterloop",
      publisher: "Health Tech Daily",
      grade: "press",
    },
    attributes: { vendor: "Meterloop", category: "observability" },
  },
  {
    id: "ch-3",
    companyId: "calder-health",
    kind: "exec_departure",
    eventDate: "2026-07-15",
    observedAt: "2026-07-16",
    excerpt:
      "Ilse Brandt has left Calder Health after six weeks as VP Engineering; the company says a search is under way.",
    source: {
      title: "Short tenure for Calder Health engineering lead",
      url: "https://healthtechdaily.example/calder-brandt-departs",
      publisher: "Health Tech Daily",
      grade: "press",
    },
    attributes: { personName: "Ilse Brandt", title: "VP Engineering", function: "engineering" },
  },

  // -- 3. Orbis Retail — the window that closed ------------------------------
  {
    id: "or-1",
    companyId: "orbis-retail",
    kind: "funding_round",
    eventDate: "2025-05-20",
    observedAt: "2025-05-20",
    excerpt: "Orbis Retail raised a $32m Series B to fund its own-brand expansion programme.",
    source: {
      title: "Orbis Retail raises $32m",
      url: "https://grocerreview.example/orbis-series-b",
      publisher: "Grocer Review",
      grade: "press",
    },
    attributes: { round: "series_b", amountUsdM: 32 },
  },
  {
    id: "or-2",
    companyId: "orbis-retail",
    kind: "role_opened",
    eventDate: "2025-06-10",
    observedAt: "2025-06-10",
    excerpt:
      "Staff Infrastructure Engineer — you will join a four-person infrastructure team maintaining our fulfilment platform.",
    source: {
      title: "Orbis Retail careers",
      url: "https://orbis-retail.example/careers/staff-infrastructure-engineer",
      publisher: "Orbis Retail careers",
      grade: "primary",
    },
    attributes: {
      roleTitle: "Staff Infrastructure Engineer",
      function: "infrastructure",
      ownership: "false",
    },
  },

  // -- 4. Halberd Systems — the company quoting itself -----------------------
  {
    id: "hs-1",
    companyId: "halberd-systems",
    kind: "hiring_surge",
    eventDate: "2026-06-25",
    observedAt: "2026-06-25",
    excerpt:
      "We are scaling our software organisation aggressively this year, with nine engineering roles open across three teams.",
    source: {
      title: "Building the Halberd software team",
      url: "https://halberd-systems.example/blog/building-the-team",
      publisher: "Halberd Systems blog",
      grade: "self_reported",
    },
    attributes: { function: "engineering", openRoles: 9 },
  },
  {
    id: "hs-2",
    companyId: "halberd-systems",
    kind: "role_opened",
    eventDate: "2026-07-02",
    observedAt: "2026-07-02",
    excerpt:
      "Our next Head of Platform will own the whole delivery stack end to end — tooling, cost and reliability.",
    source: {
      title: "Introducing our Head of Platform search",
      url: "https://halberd-systems.example/blog/head-of-platform",
      publisher: "Halberd Systems blog",
      grade: "self_reported",
    },
    attributes: { roleTitle: "Head of Platform", function: "platform", ownership: "true" },
  },

  // -- 5. Vireo Labs — the contradiction that runs one way -------------------
  {
    id: "vl-1",
    companyId: "vireo-labs",
    kind: "funding_round",
    eventDate: "2026-04-02",
    observedAt: "2026-04-02",
    excerpt: "Vireo Labs has raised a $28m Series B to expand its sequencing analysis platform.",
    source: {
      title: "Vireo Labs raises $28m Series B",
      url: "https://biotechledger.example/vireo-series-b",
      publisher: "Biotech Ledger",
      grade: "press",
    },
    attributes: { round: "series_b", amountUsdM: 28 },
  },
  {
    id: "vl-2",
    companyId: "vireo-labs",
    kind: "headcount_contraction",
    eventDate: "2026-06-18",
    observedAt: "2026-06-19",
    excerpt:
      "Vireo Labs has cut roughly 12% of staff, citing slower-than-expected contract research demand.",
    source: {
      title: "Vireo Labs cuts 12% of staff",
      url: "https://biotechledger.example/vireo-cuts",
      publisher: "Biotech Ledger",
      grade: "press",
    },
    attributes: { percent: 12 },
  },
  {
    id: "vl-3",
    companyId: "vireo-labs",
    kind: "role_opened",
    eventDate: "2026-01-15",
    observedAt: "2026-01-15",
    excerpt:
      "Infrastructure Engineer — maintain the compute estate behind our sequencing pipelines.",
    source: {
      title: "Vireo Labs careers",
      url: "https://vireo-labs.example/careers/infrastructure-engineer",
      publisher: "Vireo Labs careers",
      grade: "primary",
    },
    attributes: {
      roleTitle: "Infrastructure Engineer",
      function: "infrastructure",
      ownership: "false",
    },
  },

  // -- 6. Pell & Roe — the subsidiary's evidence -----------------------------
  {
    id: "pr-1",
    companyId: "pell-and-roe",
    kind: "exec_arrival",
    eventDate: "2026-06-22",
    observedAt: "2026-06-23",
    excerpt: "Pell & Roe has appointed Tomas Ek as Chief Technology Officer.",
    source: {
      title: "Pell & Roe appoints CTO",
      url: "https://insurancepost.example/pell-roe-cto",
      publisher: "Insurance Post",
      grade: "press",
    },
    attributes: {
      personName: "Tomas Ek",
      title: "Chief Technology Officer",
      function: "technology",
      seniority: "c_level",
    },
  },
  {
    id: "pa-1",
    companyId: "pell-analytics",
    kind: "vendor_migration",
    eventDate: "2026-01-08",
    observedAt: "2026-01-09",
    excerpt:
      "Pell Analytics, which operates independently of its brokerage parent, has migrated off Meterloop for metrics and tracing.",
    source: {
      title: "Pell Analytics leaves Meterloop",
      url: "https://insurancepost.example/pell-analytics-meterloop",
      publisher: "Insurance Post",
      grade: "press",
    },
    attributes: { vendor: "Meterloop", category: "observability" },
  },

  // -- 7. Kestrel Grid — the undated arrival ---------------------------------
  {
    id: "kg-1",
    companyId: "kestrel-grid",
    kind: "exec_arrival",
    eventDate: null,
    observedAt: "2026-07-01",
    excerpt:
      "Rhea Sandoval — VP Engineering. Rhea leads the engineering organisation at Kestrel Grid.",
    source: {
      title: "Kestrel Grid leadership",
      url: "https://kestrel-grid.example/company/leadership",
      publisher: "Kestrel Grid",
      grade: "primary",
    },
    attributes: {
      personName: "Rhea Sandoval",
      title: "VP Engineering",
      function: "engineering",
      seniority: "vp",
    },
  },
  {
    id: "kg-2",
    companyId: "kestrel-grid",
    kind: "role_opened",
    eventDate: "2026-06-15",
    observedAt: "2026-06-15",
    excerpt:
      "Head of Platform Engineering — you will own the platform, its reliability and its running cost, which today have no single owner.",
    source: {
      title: "Kestrel Grid careers",
      url: "https://kestrel-grid.example/careers/head-of-platform-engineering",
      publisher: "Kestrel Grid careers",
      grade: "primary",
    },
    attributes: {
      roleTitle: "Head of Platform Engineering",
      function: "platform",
      ownership: "true",
    },
  },

  // -- 8. Mordant Foods — one event, three headlines -------------------------
  {
    id: "mf-1",
    companyId: "mordant-foods",
    kind: "funding_round",
    eventDate: "2026-05-12",
    observedAt: "2026-05-12",
    excerpt: "Mordant Foods has raised a $41m Series B led by Ashgrove.",
    source: {
      title: "Mordant Foods raises $41m",
      url: "https://consumerbeat.example/mordant-series-b",
      publisher: "Consumer Beat",
      grade: "press",
    },
    attributes: { round: "series_b", amountUsdM: 41 },
    eventKey: "mordant-series-b-2026-05",
  },
  {
    id: "mf-2",
    companyId: "mordant-foods",
    kind: "funding_round",
    eventDate: "2026-05-12",
    observedAt: "2026-05-13",
    excerpt: "Ashgrove leads $41m round in DTC brand Mordant Foods.",
    source: {
      title: "Ashgrove leads Mordant round",
      url: "https://dealbrief.example/ashgrove-mordant",
      publisher: "Deal Brief",
      grade: "press",
    },
    attributes: { round: "series_b", amountUsdM: 41 },
    eventKey: "mordant-series-b-2026-05",
  },
  {
    id: "mf-3",
    companyId: "mordant-foods",
    kind: "funding_round",
    eventDate: "2026-05-12",
    observedAt: "2026-05-14",
    excerpt: "Mordant Foods confirms Series B at $41m, its second raise in two years.",
    source: {
      title: "Mordant confirms Series B",
      url: "https://foodindustryreview.example/mordant-confirms",
      publisher: "Food Industry Review",
      grade: "press",
    },
    attributes: { round: "series_b", amountUsdM: 41 },
    eventKey: "mordant-series-b-2026-05",
  },
  {
    id: "mf-4",
    companyId: "mordant-foods",
    kind: "role_opened",
    eventDate: "2026-02-20",
    observedAt: "2026-02-20",
    excerpt: "Platform Engineer — help run the infrastructure behind our subscription service.",
    source: {
      title: "Mordant Foods careers",
      url: "https://mordant-foods.example/careers/platform-engineer",
      publisher: "Mordant Foods careers",
      grade: "primary",
    },
    attributes: { roleTitle: "Platform Engineer", function: "platform", ownership: "false" },
  },

  // -- 9. Sable Freightways — the seller-dependent verdict -------------------
  {
    id: "sf-1",
    companyId: "sable-freightways",
    kind: "compliance_commitment",
    eventDate: "2026-03-10",
    observedAt: "2026-03-11",
    excerpt:
      "Sable Freightways said it expects to complete a SOC 2 Type II examination before it signs its first enterprise shippers in Europe.",
    source: {
      title: "Sable commits to SOC 2 ahead of EU push",
      url: "https://freightobserver.example/sable-soc2",
      publisher: "Freight Observer",
      grade: "press",
    },
    attributes: { standard: "SOC 2 Type II" },
  },
  {
    id: "sf-2",
    companyId: "sable-freightways",
    kind: "market_entry",
    eventDate: "2026-02-01",
    observedAt: "2026-02-02",
    excerpt:
      "The operator has begun handling shipments originating inside the EU, with a Rotterdam desk opening first.",
    source: {
      title: "Sable Freightways opens EU operations",
      url: "https://freightobserver.example/sable-eu",
      publisher: "Freight Observer",
      grade: "press",
    },
    attributes: { region: "eu" },
  },

  // -- 10. Ferrous Logic — the defeater that expired -------------------------
  {
    id: "fl-1",
    companyId: "ferrous-logic",
    kind: "incident_public",
    eventDate: "2026-05-25",
    observedAt: "2026-05-25",
    excerpt:
      "Ferrous Logic's settlement API was unavailable for four hours on Monday, delaying payouts for marketplace sellers.",
    source: {
      title: "Ferrous Logic outage delays payouts",
      url: "https://paymentsledger.example/ferrous-outage-may",
      publisher: "Payments Ledger",
      grade: "press",
    },
    attributes: { severity: "major" },
  },
  {
    id: "fl-2",
    companyId: "ferrous-logic",
    kind: "postmortem_published",
    eventDate: "2026-05-30",
    observedAt: "2026-05-30",
    excerpt:
      "Incident review: settlement API unavailability, 25 May. Remediation items are tracked and two of four are complete.",
    source: {
      title: "Incident review — 25 May",
      url: "https://ferrous-logic.example/status/incident-review-may",
      publisher: "Ferrous Logic status",
      grade: "primary",
    },
    attributes: { severity: "major" },
  },
  {
    id: "fl-3",
    companyId: "ferrous-logic",
    kind: "incident_public",
    eventDate: "2026-07-10",
    observedAt: "2026-07-10",
    excerpt:
      "A partial degradation affected Ferrous Logic's reconciliation endpoints for around ninety minutes on Friday.",
    source: {
      title: "Ferrous Logic reports partial degradation",
      url: "https://paymentsledger.example/ferrous-degradation-july",
      publisher: "Payments Ledger",
      grade: "press",
    },
    attributes: { severity: "partial" },
  },
  {
    id: "fl-4",
    companyId: "ferrous-logic",
    kind: "postmortem_published",
    eventDate: "2026-07-20",
    observedAt: "2026-07-20",
    excerpt:
      "Incident review: reconciliation endpoint degradation, 10 July. All remediation items are complete.",
    source: {
      title: "Incident review — 10 July",
      url: "https://ferrous-logic.example/status/incident-review-july",
      publisher: "Ferrous Logic status",
      grade: "primary",
    },
    attributes: { severity: "partial" },
  },

  // -- 11. Auric Ledger — the missing precondition ---------------------------
  {
    id: "al-1",
    companyId: "auric-ledger",
    kind: "exec_arrival",
    eventDate: "2026-06-05",
    observedAt: "2026-06-06",
    excerpt: "Auric Ledger has hired Dana Okonjo as VP Engineering.",
    source: {
      title: "Auric Ledger hires VP Engineering",
      url: "https://fintechrecord.example/auric-vp-eng",
      publisher: "Fintech Record",
      grade: "press",
    },
    attributes: {
      personName: "Dana Okonjo",
      title: "VP Engineering",
      function: "engineering",
      seniority: "vp",
    },
  },
  {
    id: "al-2",
    companyId: "auric-ledger",
    kind: "customer_win",
    eventDate: "2026-05-01",
    observedAt: "2026-05-02",
    excerpt: "Auric Ledger named a treasury provider for a listed manufacturing group.",
    source: {
      title: "Auric Ledger wins enterprise treasury mandate",
      url: "https://fintechrecord.example/auric-enterprise-win",
      publisher: "Fintech Record",
      grade: "press",
    },
    attributes: { segment: "enterprise" },
  },

  // -- 12. Tessellate — the positive control ---------------------------------
  {
    id: "ts-1",
    companyId: "tessellate",
    kind: "exec_arrival",
    eventDate: "2026-07-01",
    observedAt: "2026-07-02",
    excerpt:
      "Tessellate has appointed Marek Vidal as VP Platform Engineering, a newly created role reporting to the CTO.",
    source: {
      title: "Tessellate creates platform engineering role",
      url: "https://roboticsweekly.example/tessellate-vp-platform",
      publisher: "Robotics Weekly",
      grade: "press",
    },
    attributes: {
      personName: "Marek Vidal",
      title: "VP Platform Engineering",
      function: "platform",
      seniority: "vp",
    },
  },
  {
    id: "ts-2",
    companyId: "tessellate",
    kind: "vendor_migration",
    eventDate: "2026-05-10",
    observedAt: "2026-05-11",
    excerpt:
      "Tessellate has moved its metrics and tracing off Meterloop, citing per-host pricing on a growing fleet.",
    source: {
      title: "Tessellate leaves Meterloop over pricing",
      url: "https://roboticsweekly.example/tessellate-meterloop",
      publisher: "Robotics Weekly",
      grade: "press",
    },
    attributes: { vendor: "Meterloop", category: "observability" },
  },
  {
    id: "ts-3",
    companyId: "tessellate",
    kind: "role_opened",
    eventDate: "2026-06-15",
    observedAt: "2026-06-15",
    excerpt:
      "Head of Infrastructure — own the fleet's compute footprint, including what it costs and who pays for it.",
    source: {
      title: "Tessellate careers",
      url: "https://tessellate.example/careers/head-of-infrastructure",
      publisher: "Tessellate careers",
      grade: "primary",
    },
    attributes: {
      roleTitle: "Head of Infrastructure",
      function: "infrastructure",
      ownership: "true",
    },
  },
];

// --- Validation at import time ---------------------------------------------
// A malformed corpus is a build failure, not a quietly wrong verdict.

const parsedCompanies = RAW_COMPANIES.map((company) => companySchema.parse(company));
const parsedObservations = RAW_OBSERVATIONS.map((observation) =>
  observationSchema.parse(observation),
);

const issues = validateCorpus(parsedCompanies, parsedObservations);
if (issues.length > 0) {
  throw new Error(
    `corpus is invalid:\n${issues.map((i) => `  ${i.where}: ${i.problem}`).join("\n")}`,
  );
}

export const COMPANIES: readonly Company[] = RAW_COMPANIES;
export const OBSERVATIONS: readonly Observation[] = RAW_OBSERVATIONS;

export function companyById(id: string): Company | undefined {
  return COMPANIES.find((company) => company.id === id);
}

/** Observations belonging to this company only. Subsidiaries are separate. */
export function observationsFor(companyId: string): readonly Observation[] {
  return OBSERVATIONS.filter((observation) => observation.companyId === companyId);
}
