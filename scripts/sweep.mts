import { buildHypotheses } from "@/lib/argument/index";
import { addDays, daysBetween } from "@/lib/argument/dates";
import { COMPANIES, OBSERVATIONS } from "@/data/corpus";
import { SELLERS } from "@/data/sellers";
import { WARRANTS } from "@/data/warrants";
import type { Chain, Observation } from "@/lib/argument/types";

/**
 * The invariant sweep.
 *
 * Every account × every seller × a year of as-of dates, asserting the
 * properties the engine claims. The headline is **monotonicity**: injecting a
 * defeater never leaves a chain emitted. That is a property a prompt-based
 * build cannot state, let alone test — there is no sense in which adding a
 * sentence to a prompt is guaranteed to remove a conclusion.
 *
 * No network, no model, no randomness.
 */

const FIRST_DATE = "2025-10-01";
const DAYS = 365;

let assertions = 0;
const failures: string[] = [];

function check(condition: boolean, message: () => string): void {
  assertions += 1;
  if (!condition) failures.push(message());
}

function report(companyId: string, sellerId: string, asOf: string, observations = OBSERVATIONS) {
  const company = COMPANIES.find((entry) => entry.id === companyId);
  const seller = SELLERS.find((entry) => entry.id === sellerId);
  if (company === undefined || seller === undefined) throw new Error("bad fixture");
  return buildHypotheses({ company, observations, warrants: WARRANTS, seller, asOf });
}

/**
 * Build the observation that the chain's own W1 warrant declares would kill
 * it, dated so that both halves of the defeater rule are satisfied.
 */
function synthesiseDefeater(chain: Chain, asOf: string): Observation | null {
  const warrant = chain.links[0]?.warrant;
  const defeater = warrant?.defeaters[0];
  if (defeater === undefined) return null;
  if (chain.trigger.eventDate === null || chain.trigger.eventDate >= asOf) return null;

  const attributes: Record<string, string | number> = {};
  for (const attribute of defeater.match ?? []) {
    const value = chain.trigger.attributes[attribute];
    if (value === undefined) return null;
    attributes[attribute] = value;
  }

  return {
    id: `synthetic-${defeater.id}`,
    companyId: chain.companyId,
    kind: defeater.kind,
    eventDate: asOf,
    observedAt: asOf,
    excerpt: "synthesised by the sweep",
    source: {
      title: "sweep",
      url: "https://sweep.example/synthetic",
      publisher: "sweep",
      grade: "press",
    },
    attributes,
  };
}

const started = Date.now();
let runs = 0;
let monotonicityChecks = 0;
let determinismChecks = 0;

for (let day = 0; day < DAYS; day += 1) {
  const asOf = addDays(FIRST_DATE, day);

  for (const company of COMPANIES) {
    for (const seller of SELLERS) {
      const result = report(company.id, seller.id, asOf);
      runs += 1;

      const chains = [...result.emitted, ...result.rejected];

      for (const chain of chains) {
        check(
          chain.citations.every((citation) => citation.companyId === company.id),
          () => `${chain.id} @ ${asOf}: cited another company's observation`,
        );
        check(
          chain.citations.every((citation) => citation.observedAt <= asOf),
          () => `${chain.id} @ ${asOf}: cited evidence not yet visible`,
        );
        check(
          chain.citations.every(
            (citation) => citation.eventDate === null || citation.eventDate <= asOf,
          ),
          () => `${chain.id} @ ${asOf}: cited an event dated after the as-of date`,
        );
        check(chain.links.length === 4, () => `${chain.id} @ ${asOf}: chain is not four links`);
      }

      for (const chain of result.emitted) {
        check(
          chain.links.every((link) => link.status === "licensed"),
          () => `${chain.id} @ ${asOf}: emitted with an unlicensed link`,
        );
        check(
          chain.links[0]?.warrant !== null && chain.links[1]?.warrant !== null,
          () => `${chain.id} @ ${asOf}: emitted without a licensing warrant on W1/W2`,
        );
        check(
          chain.window !== null && chain.window.closesInDays >= 0,
          () => `${chain.id} @ ${asOf}: emitted outside its window`,
        );
        check(
          chain.window !== null && daysBetween(chain.window.opensOn, asOf) >= 0,
          () => `${chain.id} @ ${asOf}: emitted before its window opened`,
        );
        check(
          chain.sentence !== null && !/\{\w+\}/.test(chain.sentence),
          () => `${chain.id} @ ${asOf}: emitted a sentence with an unfilled slot`,
        );
        check(
          chain.reason === null,
          () => `${chain.id} @ ${asOf}: emitted while carrying a rejection reason`,
        );
      }

      for (const chain of result.rejected) {
        check(
          chain.reason !== null && chain.reason.detail.length > 0,
          () => `${chain.id} @ ${asOf}: rejected with no reason`,
        );
        check(chain.sentence === null, () => `${chain.id} @ ${asOf}: rejected but composed prose`);
      }

      const ordering = result.emitted.map((chain) => chain.window?.closesInDays ?? 0);
      check(
        ordering.every((value, index) => index === 0 || (ordering[index - 1] as number) <= value),
        () => `${company.id}/${seller.id} @ ${asOf}: emitted chains out of window order`,
      );

      // -- determinism ------------------------------------------------------
      determinismChecks += 1;
      check(
        JSON.stringify(report(company.id, seller.id, asOf)) === JSON.stringify(result),
        () => `${company.id}/${seller.id} @ ${asOf}: not deterministic`,
      );

      // -- monotonicity -----------------------------------------------------
      for (const chain of result.emitted) {
        const synthetic = synthesiseDefeater(chain, asOf);
        if (synthetic === null) continue;
        monotonicityChecks += 1;
        const after = report(company.id, seller.id, asOf, [...OBSERVATIONS, synthetic]);
        check(
          !after.emitted.some((candidate) => candidate.id === chain.id),
          () => `${chain.id} @ ${asOf}: survived its own declared defeater`,
        );
      }
    }
  }
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1);

console.log(
  [
    "",
    `  accounts        ${COMPANIES.length}`,
    `  sellers         ${SELLERS.length}`,
    `  as-of dates     ${DAYS} (${FIRST_DATE} → ${addDays(FIRST_DATE, DAYS - 1)})`,
    `  engine runs     ${runs.toLocaleString("en-GB")}`,
    `  assertions      ${assertions.toLocaleString("en-GB")}`,
    `  monotonicity    ${monotonicityChecks.toLocaleString("en-GB")} injected defeaters, every emitted chain`,
    `  determinism     ${determinismChecks.toLocaleString("en-GB")} repeat runs compared, byte for byte`,
    `  elapsed         ${elapsed}s`,
    "",
  ].join("\n"),
);

if (failures.length > 0) {
  console.error(`  FAILED — ${failures.length} violations\n`);
  for (const failure of failures.slice(0, 20)) console.error(`    ${failure}`);
  if (failures.length > 20) console.error(`    … and ${failures.length - 20} more`);
  process.exit(1);
}

console.log("  all invariants hold\n");
