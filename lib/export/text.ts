import { formatDate } from "@/lib/argument/dates";
import type { Chain, Company, HypothesisReport, Seller } from "@/lib/argument/types";

/**
 * The outreach export: the paragraph a rep actually pastes into an email, with
 * numbered footnotes so the person receiving the internal forward can check it.
 *
 * The paragraph is the engine's composed sentence verbatim. Nothing is
 * rewritten on the way out — an export that reads better than the argument
 * would undo the point of composing from warrants in the first place.
 */

function footnotes(chain: Chain): string[] {
  return chain.citations.map((citation, index) => {
    const when = citation.eventDate === null ? "undated" : formatDate(citation.eventDate);
    return `  [${index + 1}] "${citation.excerpt}" — ${citation.source.publisher}, ${when} (${citation.source.grade.replace(/_/g, "-")})\n      ${citation.source.url}`;
  });
}

function reasoning(chain: Chain): string[] {
  return chain.links
    .filter((link) => link.warrant !== null)
    .map((link) => `  ${link.id} ${link.warrant?.id} — ${link.warrant?.text}`);
}

export function toOutreachText(
  report: HypothesisReport,
  company: Company,
  seller: Seller,
): string {
  const lines: string[] = [
    `WhyNow — ${company.name} (${company.domain})`,
    `Selling ${seller.name}, ${seller.category}. As of ${formatDate(report.asOf)}.`,
    "",
  ];

  if (report.emitted.length === 0) {
    lines.push(
      `No hypothesis stands. ${report.rejected.length} candidate ${report.rejected.length === 1 ? "chain was" : "chains were"} built and every one was rejected:`,
      "",
    );
    for (const chain of report.rejected) {
      lines.push(
        `  ${chain.verdict.toUpperCase()} at ${chain.reason?.link ?? "?"} — ${chain.reason?.detail ?? ""}`,
      );
    }
    lines.push("", "Do not send. There is no reason today.");
    return lines.join("\n");
  }

  report.emitted.forEach((chain, index) => {
    lines.push(`${index + 1}. ${chain.sentence ?? ""}`, "");
    lines.push("  Evidence:");
    lines.push(...footnotes(chain));
    lines.push("", "  Licensed by:");
    lines.push(...reasoning(chain));
    if (chain.window !== null) {
      lines.push(
        "",
        `  Window: ${formatDate(chain.window.opensOn)} to ${formatDate(chain.window.closesOn)} (${chain.window.closesInDays} days left).`,
      );
    }
    lines.push("");
  });

  const counts = (["blocked", "defeated", "stale", "unsupported"] as const)
    .map((verdict) => [verdict, report.counts[verdict]] as const)
    .filter(([, count]) => count > 0)
    .map(([verdict, count]) => `${count} ${verdict}`);

  if (counts.length > 0) {
    lines.push(`Also considered and rejected: ${counts.join(", ")}.`);
  }

  return lines.join("\n");
}

export function toAuditJson(report: HypothesisReport): string {
  return JSON.stringify(report, null, 2);
}
