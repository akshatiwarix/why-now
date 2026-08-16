import type { Link, SourceGrade, Verdict } from "@/lib/argument/types";

/** Shared presentational bits. Nothing here decides a verdict. */

export const VERDICT_STYLE: Record<
  Verdict,
  { readonly chip: string; readonly label: string; readonly hint: string }
> = {
  emitted: {
    chip: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    label: "Emitted",
    hint: "every link licensed, nothing rebutting it, window open",
  },
  blocked: {
    chip: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    label: "Blocked",
    hint: "no warrant licenses one of the links",
  },
  defeated: {
    chip: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300",
    label: "Defeated",
    hint: "a declared defeater fired — evidence in the corpus kills it",
  },
  stale: {
    chip: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
    label: "Stale",
    hint: "licensed, but the window closed before the as-of date",
  },
  unsupported: {
    chip: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-300",
    label: "Unsupported",
    hint: "the trigger is undated, so no window can be anchored",
  },
};

export const GRADE_STYLE: Record<SourceGrade, { readonly chip: string; readonly label: string }> = {
  primary: {
    chip: "border-sky-300 text-sky-700 dark:border-sky-800 dark:text-sky-400",
    label: "primary",
  },
  press: {
    chip: "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400",
    label: "press",
  },
  self_reported: {
    chip: "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400",
    label: "self-reported",
  },
};

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const style = VERDICT_STYLE[verdict];
  return (
    <span
      title={style.hint}
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${style.chip}`}
    >
      {style.label}
    </span>
  );
}

export function GradeChip({ grade }: { grade: SourceGrade }) {
  const style = GRADE_STYLE[grade];
  return (
    <span
      className={`inline-block rounded border px-1.5 py-px text-[10px] tracking-wide uppercase ${style.chip}`}
    >
      {style.label}
    </span>
  );
}

export function humanise(token: string): string {
  return token.replace(/_/g, " ");
}

export function linkTone(status: Link["status"]): string {
  switch (status) {
    case "licensed":
      return "text-emerald-600 dark:text-emerald-500";
    case "defeated":
      return "text-rose-600 dark:text-rose-500";
    case "closed":
      return "text-amber-600 dark:text-amber-500";
    case "unlicensed":
      return "text-slate-400 dark:text-slate-600";
  }
}

export function Rung({ status }: { status: Link["status"] }) {
  const broken = status !== "licensed";
  return (
    <div
      aria-hidden
      className={`${broken ? "rung-line-broken" : "rung-line"} ${linkTone(status)} h-full`}
    />
  );
}

export function SectionTitle({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <h2 className="flex items-baseline gap-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-500">
      {children}
      {count !== undefined ? (
        <span className="font-mono text-[11px] tracking-normal text-slate-400">{count}</span>
      ) : null}
    </h2>
  );
}
