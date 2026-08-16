"use client";

import { useMemo, useState } from "react";
import { buildHypotheses } from "@/lib/argument/index";
import type { Company, Observation, Seller, Warrant } from "@/lib/argument/types";
import { AccountList, type AccountSummary } from "./AccountList";
import { ArgumentLadder } from "./ArgumentLadder";
import { RejectedPane } from "./RejectedPane";
import { SectionTitle } from "./ui";

/**
 * The engine runs here, in the browser.
 *
 * It is pure and cheap, so changing the as-of date or the seller recomputes
 * every verdict with no round trip and no spinner. `/api/hypotheses` runs the
 * same function server-side for programmatic use, and `equivalence.test.ts`
 * asserts the two agree byte for byte.
 */

export type ConsoleData = {
  readonly companies: readonly Company[];
  readonly observations: readonly Observation[];
  readonly sellers: readonly Seller[];
  readonly warrants: readonly Warrant[];
  readonly defaultAsOf: string;
};

export function Console({ data }: { data: ConsoleData }) {
  const [companyId, setCompanyId] = useState(data.companies[0]?.id ?? "");
  const [sellerId, setSellerId] = useState(data.sellers[0]?.id ?? "");
  const [asOf, setAsOf] = useState(data.defaultAsOf);

  const seller = data.sellers.find((entry) => entry.id === sellerId) ?? data.sellers[0];
  const company = data.companies.find((entry) => entry.id === companyId) ?? data.companies[0];

  const summaries: readonly AccountSummary[] = useMemo(() => {
    if (seller === undefined) return [];
    return data.companies.map((entry) => {
      const report = buildHypotheses({
        company: entry,
        observations: data.observations,
        warrants: data.warrants,
        seller,
        asOf,
      });
      return { company: entry, emitted: report.emitted.length, rejected: report.rejected.length };
    });
  }, [data.companies, data.observations, data.warrants, seller, asOf]);

  const report = useMemo(() => {
    if (company === undefined || seller === undefined) return null;
    return buildHypotheses({
      company,
      observations: data.observations,
      warrants: data.warrants,
      seller,
      asOf,
    });
  }, [company, seller, data.observations, data.warrants, asOf]);

  if (company === undefined || seller === undefined || report === null) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">WhyNow</h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          A why-now is an argument, not a signal list. Every link below is licensed by a declared
          warrant — or visibly broken.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">As of</span>
          <input
            type="date"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
            className="rounded border border-slate-300 bg-transparent px-2 py-1 font-mono text-sm dark:border-slate-700"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-sm text-slate-500 dark:text-slate-400">Selling</span>
          {data.sellers.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSellerId(entry.id)}
              title={entry.category}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                entry.id === sellerId
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {entry.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="space-y-3">
          <SectionTitle count={data.companies.length}>Accounts</SectionTitle>
          <AccountList summaries={summaries} selectedId={company.id} onSelect={setCompanyId} />
        </aside>

        <main className="min-w-0 space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-semibold">{company.name}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{company.description}</p>
            <p className="mt-2 border-l-2 border-amber-300 pl-3 text-sm text-slate-600 dark:border-amber-800 dark:text-slate-400">
              <span className="font-medium">Trap {company.trap.id} — {company.trap.name}.</span>{" "}
              {company.trap.expectation}
            </p>
          </section>

          <section className="space-y-3">
            <SectionTitle count={report.emitted.length}>Emitted</SectionTitle>
            {report.emitted.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-500">
                No hypothesis stands for {seller.name} against this account today. That is an
                answer, not an empty state — every chain the library could build is below, with the
                rung that broke.
              </p>
            ) : (
              report.emitted.map((chain) => <ArgumentLadder key={chain.id} chain={chain} />)
            )}
          </section>

          <RejectedPane chains={report.rejected} />
        </main>
      </div>
    </div>
  );
}
