import type { CorrelatedAlert, DomainConfig } from "../types";
import { DOMAINS } from "../data/config";

interface Props {
  alerts: CorrelatedAlert[];
  totalEvents: number;
  uniqueThreats: number;
}

const DOMAIN_MAP: Record<string, DomainConfig> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d])
);

const ALERT_ICONS: Record<string, string> = {
  CORRELATED_THREAT: "◉",
  PATTERN_MATCH: "◎",
  CROSS_DOMAIN_ANOMALY: "△",
  SYNCHRONIZED_ACTIVITY: "◈",
};

const ALERT_SEVERITY_STYLES: Record<string, string> = {
  MEDIUM: "border-yellow-700/50 bg-yellow-950/20",
  HIGH: "border-orange-700/50 bg-orange-950/20",
  CRITICAL: "border-red-700/60 bg-red-950/25",
};

const ALERT_SEVERITY_TEXT: Record<string, string> = {
  MEDIUM: "text-yellow-400",
  HIGH: "text-orange-400",
  CRITICAL: "text-red-400",
};

export function CorrelatedView({ alerts, totalEvents, uniqueThreats }: Props) {
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a) => a.severity === "HIGH").length;

  return (
    <div className="flex flex-col rounded-lg border border-slate-600/40 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/60 bg-slate-800/40">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-slate-300" style={{ boxShadow: "0 0 8px rgba(255,255,255,0.4)" }} />
          <span className="text-xs font-semibold tracking-widest text-slate-200">
            HIGH SIDE — UNIFIED CORRELATION VIEW
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-slate-400">{totalEvents} total events ingested</span>
          <span className="text-red-400">{criticalCount} CRITICAL</span>
          <span className="text-orange-400">{highCount} HIGH</span>
          <span className="text-slate-300">{uniqueThreats} correlated alerts</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-0 border-b border-slate-800">
        {DOMAINS.map((domain) => {
          const domainAlerts = alerts.filter((a) => a.domains.includes(domain.id));
          return (
            <div
              key={domain.id}
              className="flex items-center justify-between px-4 py-2 border-r border-slate-800 last:border-r-0"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: domain.color }} />
                <span className={`text-xs font-mono font-semibold ${domain.textClass}`}>{domain.label}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{domainAlerts.length} correlated</span>
            </div>
          );
        })}
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: "320px" }}>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-slate-600 text-sm gap-2">
            <span className="text-2xl opacity-30">◎</span>
            <span className="text-xs">No correlated alerts yet — start simulation to detect cross-domain patterns</span>
          </div>
        ) : (
          alerts.slice(0, 20).map((alert, i) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${ALERT_SEVERITY_STYLES[alert.severity]} ${i === 0 ? "corr-enter" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm font-mono flex-shrink-0 ${ALERT_SEVERITY_TEXT[alert.severity]}`}>
                    {ALERT_ICONS[alert.type]}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold font-mono ${ALERT_SEVERITY_TEXT[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{alert.type.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{alert.summary}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {alert.domains.map((did) => {
                      const d = DOMAIN_MAP[did];
                      return (
                        <span
                          key={did}
                          className={`text-xs px-1.5 py-0 rounded font-mono ${d.badgeClass}`}
                        >
                          {did}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span>conf: {alert.confidence}%</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
