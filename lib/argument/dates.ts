/**
 * ISO date arithmetic. Strings in, strings out, UTC throughout — a window that
 * closes on a different day depending on where the reviewer sits is a bug.
 */

const MS_PER_DAY = 86_400_000;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function toEpochDay(iso: string): number {
  const ms = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`not an ISO date: ${iso}`);
  return Math.round(ms / MS_PER_DAY);
}

export function fromEpochDay(day: number): string {
  const date = new Date(day * MS_PER_DAY);
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

/** Positive when `to` is later than `from`. */
export function daysBetween(from: string, to: string): number {
  return toEpochDay(to) - toEpochDay(from);
}

export function addDays(iso: string, days: number): string {
  return fromEpochDay(toEpochDay(iso) + days);
}

/** `2026-06-04` → `4 June 2026`. Explicit month names, not `Intl`, so the
 * rendered sentence does not depend on the reviewer's locale. */
export function formatDate(iso: string): string {
  const parts = iso.split("-");
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year === undefined || month === undefined || day === undefined) return iso;
  const name = MONTHS[Number(month) - 1];
  if (name === undefined) return iso;
  return `${Number(day)} ${name} ${year}`;
}
