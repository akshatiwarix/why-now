"use client";

import type { Company } from "@/lib/argument/types";

export type AccountSummary = {
  readonly company: Company;
  readonly emitted: number;
  readonly rejected: number;
};

export function AccountList({
  summaries,
  selectedId,
  onSelect,
}: {
  summaries: readonly AccountSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="Accounts" className="space-y-1">
      {summaries.map(({ company, emitted, rejected }) => {
        const selected = company.id === selectedId;
        return (
          <button
            key={company.id}
            type="button"
            onClick={() => onSelect(company.id)}
            aria-current={selected ? "true" : undefined}
            className={`block w-full rounded-md px-3 py-2 text-left transition-colors ${
              selected
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "hover:bg-slate-200/70 dark:hover:bg-slate-800/70"
            }`}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{company.name}</span>
              <span
                className={`font-mono text-[11px] ${
                  selected ? "opacity-80" : "text-slate-500 dark:text-slate-500"
                }`}
              >
                {emitted}/{emitted + rejected}
              </span>
            </span>
            <span
              className={`block truncate text-[11px] ${
                selected ? "opacity-70" : "text-slate-500 dark:text-slate-500"
              }`}
            >
              trap {company.trap.id} — {company.trap.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
