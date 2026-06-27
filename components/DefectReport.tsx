"use client";

import type { DefectReport, DefectFinding } from "@/lib/types";

const SEVERITY_STYLES: Record<DefectFinding["severity"], string> = {
  minor: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
  moderate: "bg-orange-500/15 text-orange-300 border border-orange-500/30",
  major: "bg-red-500/15 text-red-300 border border-red-500/30",
};

const CONDITION_STYLES: Record<DefectReport["overallCondition"], string> = {
  excellent: "text-emerald-400",
  good: "text-green-400",
  fair: "text-yellow-400",
  poor: "text-red-400",
};

interface Props {
  report: DefectReport;
  loading?: false;
  onSelectFinding?: (index: number) => void;
  selectedFinding?: number | null;
}

interface LoadingProps {
  loading: true;
}

export default function DefectReportPanel(props: Props | LoadingProps) {
  if ("loading" in props && props.loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <h2 className="text-lg font-semibold text-white">Scanning photos for defects…</h2>
        </div>
        <p className="text-zinc-400 text-sm">
          Claude is reviewing the listing photos like a careful inspector. This takes 15–30 seconds.
        </p>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { report, onSelectFinding, selectedFinding } = props as Props;
  const majorCount = report.findings.filter((f) => f.severity === "major").length;
  const moderateCount = report.findings.filter((f) => f.severity === "moderate").length;
  const minorCount = report.findings.filter((f) => f.severity === "minor").length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Defect Report</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Best-effort visual read from listing photos — not a substitute for an in-person inspection.
          </p>
        </div>
        <div className={`text-sm font-bold uppercase tracking-wider ${CONDITION_STYLES[report.overallCondition]}`}>
          {report.overallCondition}
        </div>
      </div>

      {/* Counts */}
      <div className="flex gap-3 mb-5">
        {majorCount > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
            {majorCount} major
          </span>
        )}
        {moderateCount > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            {moderateCount} moderate
          </span>
        )}
        {minorCount > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
            {minorCount} minor
          </span>
        )}
        {report.findings.length === 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            No defects spotted
          </span>
        )}
      </div>

      {/* Findings list */}
      {report.findings.length > 0 ? (
        <div className="space-y-2 mb-5">
          {report.findings.map((finding, i) => (
            <button
              key={i}
              onClick={() => onSelectFinding?.(i)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedFinding === i
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-zinc-700/50 bg-zinc-800/40 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${SEVERITY_STYLES[finding.severity]}`}>
                  {finding.severity}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-200">{finding.location}</div>
                  <div className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{finding.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-zinc-400 text-sm mb-5">
          No notable defects were visible in the available photos. Always verify in person.
        </p>
      )}

      {/* Summary */}
      <div className="border-t border-zinc-800 pt-4 space-y-3">
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Inspector Summary</div>
          <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Buy Recommendation</div>
          <p className="text-sm text-zinc-200 leading-relaxed">{report.buyRecommendation}</p>
        </div>
      </div>

      {/* Carfax note */}
      <div className="mt-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
        <p className="text-xs text-zinc-500">
          <span className="text-zinc-400 font-medium">No history report included.</span> Carfax/AutoCheck require a paid
          partner API (VinAudit, etc.) — flagged for a future version. Always pull a history report before buying.
        </p>
      </div>
    </div>
  );
}
