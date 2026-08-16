import type { Chain, Link, Observation } from "@/lib/argument/types";
import { formatDate } from "@/lib/argument/dates";
import { GradeChip, Rung, VerdictChip, humanise, linkTone } from "./ui";

/**
 * A chain drawn as a ladder: the trigger at the top, a rung per inferential
 * link, the window at the bottom. The same component draws emitted and
 * rejected chains — a rejection is the identical argument with one rung
 * broken, and showing it any other way would hide the point.
 */

function Node({
  label,
  value,
  muted = false,
  children,
}: {
  label: string;
  value: string;
  muted?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-6 shrink-0" />
      <div className="min-w-0 flex-1 pb-1">
        <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase dark:text-slate-600">
          {label}
        </div>
        <div
          className={`font-medium ${muted ? "text-slate-400 dark:text-slate-600" : "text-slate-900 dark:text-slate-100"}`}
        >
          {value}
        </div>
        {children}
      </div>
    </div>
  );
}

function Evidence({ observation }: { observation: Observation }) {
  return (
    <figure className="mt-1.5 border-l-2 border-slate-200 pl-3 dark:border-slate-800">
      <blockquote className="text-sm text-slate-600 italic dark:text-slate-400">
        “{observation.excerpt}”
      </blockquote>
      <figcaption className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-500">
        <GradeChip grade={observation.source.grade} />
        <span>{observation.source.publisher}</span>
        <span aria-hidden>·</span>
        <span>
          {observation.eventDate === null ? "undated" : formatDate(observation.eventDate)}
        </span>
      </figcaption>
    </figure>
  );
}

function statusMark(status: Link["status"]): string {
  switch (status) {
    case "licensed":
      return "licensed";
    case "defeated":
      return "defeated";
    case "closed":
      return "window closed";
    case "unlicensed":
      return "not licensed";
  }
}

function Connector({ link }: { link: Link }) {
  const tone = linkTone(link.status);
  const hasDetail =
    link.warrant !== null || link.preconditionChecks.length > 0 || link.clearedDefeaters.length > 0;

  return (
    <div className="flex gap-3">
      <div className="flex w-6 shrink-0 justify-center">
        <Rung status={link.status} />
      </div>
      <details className="min-w-0 flex-1 py-1.5" open={link.status === "defeated"}>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-sm">
          <span className={`font-mono text-[11px] ${tone}`}>{link.id}</span>
          <span className={`${tone}`}>{statusMark(link.status)}</span>
          <span className="text-slate-500 dark:text-slate-500">— {link.detail}</span>
        </summary>

        {hasDetail ? (
          <div className="mt-2 space-y-2 rounded-md bg-slate-100/70 p-3 text-sm dark:bg-slate-900">
            {link.warrant !== null ? (
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-mono text-[11px] text-slate-400">{link.warrant.id}</span>{" "}
                {link.warrant.text}
              </p>
            ) : null}

            {link.preconditionChecks.length > 0 ? (
              <ul className="space-y-0.5">
                {link.preconditionChecks.map((check) => (
                  <li
                    key={check.text}
                    className={
                      check.held
                        ? "text-emerald-700 dark:text-emerald-500"
                        : "text-rose-700 dark:text-rose-400"
                    }
                  >
                    <span className="font-mono text-[11px]">{check.held ? "held" : "unmet"}</span>{" "}
                    {check.text}
                    {check.evidenceId !== null ? (
                      <span className="ml-1 font-mono text-[10px] text-slate-400">
                        {check.evidenceId}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {link.firedDefeater !== null ? (
              <div className="rounded border border-rose-200 bg-rose-50 p-2 dark:border-rose-900 dark:bg-rose-950/40">
                <p className="text-rose-800 dark:text-rose-300">
                  Defeated — {link.firedDefeater.defeater.text}.
                </p>
                <Evidence observation={link.firedDefeater.observation} />
              </div>
            ) : null}

            {link.clearedDefeaters.length > 0 ? (
              <p className="text-slate-500 dark:text-slate-500">
                Checked and did not fire: {link.clearedDefeaters.join(", ")}.
              </p>
            ) : null}
          </div>
        ) : null}
      </details>
    </div>
  );
}

export function ArgumentLadder({ chain }: { chain: Chain }) {
  const [w1, w2, w3, w4] = chain.links;
  if (w1 === undefined || w2 === undefined || w3 === undefined || w4 === undefined) return null;

  const dead = chain.verdict !== "emitted";

  return (
    <article
      className={`rounded-lg border p-4 ${
        dead
          ? "border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40"
          : "border-emerald-200 bg-white shadow-sm dark:border-emerald-900 dark:bg-slate-900"
      }`}
    >
      <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <VerdictChip verdict={chain.verdict} />
        <h3 className="font-semibold">{humanise(w2.to)}</h3>
        {/* A countdown on a blocked chain is noise: the window is irrelevant
            when the argument never reached it. Only emitted and stale chains
            are actually about timing. */}
        {chain.window !== null &&
        (chain.verdict === "emitted" || chain.verdict === "stale") ? (
          <span
            className={`font-mono text-xs ${
              chain.window.closesInDays < 0
                ? "text-amber-600 dark:text-amber-500"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {chain.window.closesInDays < 0
              ? `closed ${-chain.window.closesInDays}d ago`
              : `${chain.window.closesInDays}d left`}
          </span>
        ) : null}
      </header>

      {chain.sentence !== null ? (
        <p className="mb-4 rounded-md bg-emerald-50 p-3 text-[15px] leading-relaxed text-slate-800 dark:bg-emerald-950/30 dark:text-slate-200">
          {chain.sentence}
        </p>
      ) : null}

      {chain.reason !== null ? (
        <p className="mb-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <span className="font-mono text-[11px] text-slate-400">{chain.reason.link}</span>{" "}
          {chain.reason.detail}
        </p>
      ) : null}

      <div>
        <Node
          label="Trigger"
          value={`${humanise(chain.trigger.kind)}${
            chain.trigger.eventDate === null ? "" : ` · ${formatDate(chain.trigger.eventDate)}`
          }`}
        >
          <Evidence observation={chain.trigger} />
        </Node>

        <Connector link={w1} />
        <Node label="Buyer state" value={humanise(w1.to)} muted={w1.status !== "licensed"} />

        <Connector link={w2} />
        <Node label="Problem" value={humanise(w2.to)} muted={w2.status !== "licensed"} />

        <Connector link={w3} />
        <Node
          label="Relevance"
          value={w3.status === "licensed" ? humanise(w3.to) : "nothing this seller does"}
          muted={w3.status !== "licensed"}
        />

        <Connector link={w4} />
        <Node
          label="Why now"
          value={
            chain.window === null
              ? "no window"
              : `${formatDate(chain.window.opensOn)} → ${formatDate(chain.window.closesOn)}`
          }
          muted={w4.status !== "licensed"}
        />
      </div>

      {chain.citations.length > 1 ? (
        <footer className="mt-3 border-t border-slate-200 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-500">
          Evidence: {chain.citations.map((citation) => citation.source.publisher).join(", ")}
        </footer>
      ) : null}
    </article>
  );
}
