"use client";

import { useState } from "react";
import type { Chain, HypothesisReport, Observation } from "@/lib/argument/types";
import { ArgumentLadder } from "./ArgumentLadder";
import { SectionTitle } from "./ui";

/**
 * The live path. Prose in, typed observations out, then the same engine on the
 * same rules — a pasted observation gets no special treatment, and a model
 * cannot talk its way past a rung.
 *
 * Without a key this panel reports 501 and nothing else in the app changes.
 * That is a first-class state, not an error.
 */

type Response = {
  readonly report: HypothesisReport;
  readonly observations: readonly Observation[];
  readonly droppedCandidates: readonly { readonly excerpt: string; readonly reason: string }[];
};

export function PastePanel({ sellerId, asOf }: { sellerId: string; asOf: string }) {
  const [text, setText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Response | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/parse-observations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, companyName, sellerId, asOf }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      setResult(body as Response);
    } catch {
      setError("The request failed before it reached the server.");
    } finally {
      setBusy(false);
    }
  }

  const chains: readonly Chain[] = result === null ? [] : result.report.rejected;

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <summary className="cursor-pointer text-sm font-medium">
        Paste real evidence
        <span className="ml-2 text-slate-500 dark:text-slate-500">
          — needs an API key; the twelve bundled accounts do not
        </span>
      </summary>

      <div className="mt-3 space-y-3">
        <input
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Company name"
          className="w-full rounded border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700"
        />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          placeholder="Paste press coverage, job postings, filings or blog posts about one company. The model turns them into typed, dated, quoted observations — it does not decide whether any of it is a reason to reach out."
          className="w-full rounded border border-slate-300 bg-transparent px-2 py-1.5 font-mono text-xs dark:border-slate-700"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={busy || text.length < 40 || companyName.length === 0}
            onClick={submit}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
          >
            {busy ? "Parsing…" : "Parse and run"}
          </button>
          <span className="text-[11px] text-slate-500 dark:text-slate-500">
            {text.length < 40 ? "at least 40 characters" : `${text.length} characters`}
          </span>
        </div>

        {error !== null ? (
          <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            {error}
          </p>
        ) : null}

        {result !== null ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {result.observations.length} observation
              {result.observations.length === 1 ? "" : "s"} accepted
              {result.droppedCandidates.length > 0
                ? `, ${result.droppedCandidates.length} dropped`
                : ""}
              .
            </p>

            {result.droppedCandidates.length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-500">
                {result.droppedCandidates.map((dropped) => (
                  <li key={dropped.excerpt}>
                    dropped — {dropped.reason}: “{dropped.excerpt.slice(0, 90)}…”
                  </li>
                ))}
              </ul>
            ) : null}

            <SectionTitle count={result.report.emitted.length}>Emitted</SectionTitle>
            {result.report.emitted.map((chain) => (
              <ArgumentLadder key={chain.id} chain={chain} />
            ))}

            <SectionTitle count={chains.length}>Rejected</SectionTitle>
            {chains.map((chain) => (
              <ArgumentLadder key={chain.id} chain={chain} />
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}
