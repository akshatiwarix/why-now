"use client";

import { addDays, daysBetween, formatDate } from "@/lib/argument/dates";
import type { Chain, Observation } from "@/lib/argument/types";

/**
 * The timeline is "why now" made visual: observations as points, each
 * actionability window as a span, and the as-of date as a line moving across
 * them. Window overlap with that line *is* the thesis, which is why this is a
 * timeline and not a reuse of Day 005's scrubber — a scrubber can show a score
 * changing, but it cannot show a window closing.
 */

type Span = { readonly chain: Chain; readonly open: boolean };

function bounds(observations: readonly Observation[], chains: readonly Chain[], asOf: string) {
  const dates: string[] = [asOf];
  for (const observation of observations) {
    if (observation.eventDate !== null) dates.push(observation.eventDate);
  }
  for (const chain of chains) {
    if (chain.window !== null) dates.push(chain.window.opensOn, chain.window.closesOn);
  }
  const sorted = [...dates].sort();
  const first = sorted[0] ?? asOf;
  const last = sorted[sorted.length - 1] ?? asOf;
  return { start: addDays(first, -20), end: addDays(last, 20) };
}

export function Timeline({
  observations,
  chains,
  asOf,
}: {
  observations: readonly Observation[];
  chains: readonly Chain[];
  asOf: string;
}) {
  const withWindows: Span[] = chains
    .filter((chain) => chain.window !== null)
    .map((chain) => ({ chain, open: (chain.window?.closesInDays ?? -1) >= 0 }));

  const { start, end } = bounds(observations, chains, asOf);
  const total = Math.max(1, daysBetween(start, end));
  const at = (date: string) => (daysBetween(start, date) / total) * 100;

  const dated = observations.filter((observation) => observation.eventDate !== null);
  const undatedCount = observations.length - dated.length;

  return (
    <figure className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-500">
        <span className="font-semibold tracking-[0.14em] uppercase">Timeline</span>
        <span>
          {formatDate(start)} — {formatDate(end)}
          {undatedCount > 0 ? ` · ${undatedCount} undated, not placeable` : ""}
        </span>
      </figcaption>

      <div className="relative">
        {/* windows */}
        <div className="space-y-1">
          {withWindows.length === 0 ? (
            <p className="py-2 text-sm text-slate-400 dark:text-slate-600">
              No chain here has a window — nothing dated to anchor one.
            </p>
          ) : (
            withWindows.map(({ chain, open }) => {
              const window = chain.window;
              if (window === null) return null;
              const left = at(window.opensOn);
              const width = Math.max(0.8, at(window.closesOn) - left);
              return (
                <div key={chain.id} className="relative h-4">
                  <div
                    title={`${chain.links[1]?.to ?? ""}: ${formatDate(window.opensOn)} to ${formatDate(window.closesOn)}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    className={`absolute top-1 h-2 rounded-full ${
                      open
                        ? chain.verdict === "emitted"
                          ? "bg-emerald-400 dark:bg-emerald-600"
                          : "bg-slate-300 dark:bg-slate-700"
                        : "bg-amber-200 dark:bg-amber-900"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* observations */}
        <div className="relative mt-2 h-5 border-t border-slate-200 dark:border-slate-800">
          {dated.map((observation) => (
            <div
              key={observation.id}
              title={`${observation.kind} · ${formatDate(observation.eventDate as string)} · ${observation.source.publisher}`}
              style={{ left: `${at(observation.eventDate as string)}%` }}
              className="absolute top-2 -ml-1 h-2 w-2 rounded-full bg-slate-500 dark:bg-slate-400"
            />
          ))}
        </div>

        {/* as-of line */}
        <div
          style={{ left: `${at(asOf)}%` }}
          className="pointer-events-none absolute inset-y-0 w-px bg-slate-900 dark:bg-slate-100"
        >
          <span className="absolute -top-1 left-1 rounded bg-slate-900 px-1 font-mono text-[10px] whitespace-nowrap text-white dark:bg-slate-100 dark:text-slate-900">
            {asOf}
          </span>
        </div>
      </div>
    </figure>
  );
}
