"use client";

import { useState } from "react";
import type { Chain, Verdict } from "@/lib/argument/types";
import { ArgumentLadder } from "./ArgumentLadder";
import { SectionTitle, VERDICT_STYLE } from "./ui";

/**
 * The rejected pane is a shipped feature, open by default. The argument that
 * died — and the named reason it died — is the demonstration; hiding it behind
 * a toggle would turn this back into a tool that only ever agrees with you.
 */

const ORDER: readonly Verdict[] = ["defeated", "blocked", "stale", "unsupported"];

export function RejectedPane({ chains }: { chains: readonly Chain[] }) {
  const [filter, setFilter] = useState<Verdict | "all">("all");

  if (chains.length === 0) {
    return (
      <section className="space-y-2">
        <SectionTitle count={0}>Rejected</SectionTitle>
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-500">
          Nothing was rejected here. Every chain the warrant library could build for this account
          and seller is standing.
        </p>
      </section>
    );
  }

  const counts = ORDER.map(
    (verdict) => [verdict, chains.filter((chain) => chain.verdict === verdict).length] as const,
  ).filter(([, count]) => count > 0);

  const shown = filter === "all" ? chains : chains.filter((chain) => chain.verdict === filter);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SectionTitle count={chains.length}>Rejected</SectionTitle>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              filter === "all"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            all {chains.length}
          </button>
          {counts.map(([verdict, count]) => (
            <button
              key={verdict}
              type="button"
              onClick={() => setFilter(verdict)}
              title={VERDICT_STYLE[verdict].hint}
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                filter === verdict
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : VERDICT_STYLE[verdict].chip
              }`}
            >
              {VERDICT_STYLE[verdict].label.toLowerCase()} {count}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {shown.map((chain) => (
          <ArgumentLadder key={chain.id} chain={chain} />
        ))}
      </div>
    </section>
  );
}
