"use client";

import type { DefectReport, DefectFinding } from "@/lib/types";

const SEVERITY_CONFIG = {
  major:    { color: "text-[#ff453a]", bg: "bg-[#ff453a]/10", dot: "bg-[#ff453a]", label: "Major" },
  moderate: { color: "text-[#ff9f0a]", bg: "bg-[#ff9f0a]/10", dot: "bg-[#ff9f0a]", label: "Moderate" },
  minor:    { color: "text-[#ffd60a]", bg: "bg-[#ffd60a]/10", dot: "bg-[#ffd60a]", label: "Minor" },
} satisfies Record<DefectFinding["severity"], { color: string; bg: string; dot: string; label: string }>;

const CONDITION_CONFIG = {
  excellent: { color: "text-[#30d158]", label: "Excellent" },
  good:      { color: "text-[#34c759]", label: "Good" },
  fair:      { color: "text-[#ff9f0a]", label: "Fair" },
  poor:      { color: "text-[#ff453a]", label: "Poor" },
} satisfies Record<DefectReport["overallCondition"], { color: string; label: string }>;

type Props =
  | { loading: true }
  | { loading?: false; report: DefectReport; onSelectFinding?: (i: number) => void; selectedFinding?: number | null };

export default function DefectReportPanel(props: Props) {
  if ("loading" in props && props.loading) {
    return (
      <div className="rounded-[16px] bg-[#0f0f0f] border border-white/[0.07] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-4 rounded-full border-[1.5px] border-white/10 border-t-[#0a84ff] animate-spin shrink-0" />
          <span className="text-[14px] font-semibold text-white/80">Scanning photos for defects…</span>
        </div>
        <p className="text-[13px] text-white/30 mb-5 leading-relaxed">
          Claude is reviewing the listing photos like a careful inspector. 15–30 seconds.
        </p>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[58px] rounded-[10px] bg-white/[0.04] animate-pulse" style={{ opacity: 1 - (i - 1) * 0.25 }} />
          ))}
        </div>
      </div>
    );
  }

  const { report, onSelectFinding, selectedFinding } = props as Extract<Props, { loading?: false }>;
  const cond = CONDITION_CONFIG[report.overallCondition];
  const counts = {
    major: report.findings.filter((f) => f.severity === "major").length,
    moderate: report.findings.filter((f) => f.severity === "moderate").length,
    minor: report.findings.filter((f) => f.severity === "minor").length,
  };

  return (
    <div className="rounded-[16px] bg-[#0f0f0f] border border-white/[0.07] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-[14px] font-semibold text-white/90">AI Defect Report</h2>
          <p className="text-[11px] text-white/25 mt-0.5">Best-effort visual read — not a substitute for in-person inspection</p>
        </div>
        <span className={`text-[13px] font-bold shrink-0 ml-4 ${cond.color}`}>{cond.label}</span>
      </div>

      {/* Count pills */}
      <div className="flex gap-1.5 px-5 py-3 border-b border-white/[0.05]">
        {counts.major > 0 && <Pill color="text-[#ff453a]" bg="bg-[#ff453a]/10">{counts.major} major</Pill>}
        {counts.moderate > 0 && <Pill color="text-[#ff9f0a]" bg="bg-[#ff9f0a]/10">{counts.moderate} moderate</Pill>}
        {counts.minor > 0 && <Pill color="text-[#ffd60a]" bg="bg-[#ffd60a]/10">{counts.minor} minor</Pill>}
        {report.findings.length === 0 && <Pill color="text-[#30d158]" bg="bg-[#30d158]/10">No defects spotted</Pill>}
      </div>

      {/* Findings list */}
      {report.findings.length > 0 && (
        <div className="px-4 py-3 space-y-1">
          {report.findings.map((f, i) => {
            const cfg = SEVERITY_CONFIG[f.severity];
            const active = selectedFinding === i;
            return (
              <button
                key={i}
                onClick={() => onSelectFinding?.(i)}
                className={`w-full text-left flex items-start gap-3 px-3.5 py-3 rounded-[10px] border transition-all duration-150 ${
                  active
                    ? "bg-[#0a84ff]/[0.08] border-[#0a84ff]/20"
                    : "border-transparent hover:bg-white/[0.03] hover:border-white/[0.07]"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[13px] font-medium text-white/75 truncate">{f.location}</span>
                  </div>
                  <p className="text-[12px] text-white/38 mt-0.5 leading-relaxed">{f.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="px-5 py-4 border-t border-white/[0.06] space-y-4">
        {report.findings.length === 0 && (
          <p className="text-[13px] text-white/35 leading-relaxed">
            No notable defects visible in the available photos. Always verify in person.
          </p>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/22 mb-1.5">Summary</p>
          <p className="text-[13px] text-white/55 leading-relaxed">{report.summary}</p>
        </div>
        <div className="rounded-[10px] bg-white/[0.03] border border-white/[0.06] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/22 mb-1.5">Buy Recommendation</p>
          <p className="text-[13px] text-white/80 leading-relaxed">{report.buyRecommendation}</p>
        </div>
        <p className="text-[11px] text-white/18 leading-relaxed">
          No history report — Carfax/AutoCheck require a paid partner API (future version). Always pull a history report before buying.
        </p>
      </div>
    </div>
  );
}

function Pill({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-semibold ${color} ${bg}`}>
      {children}
    </span>
  );
}
