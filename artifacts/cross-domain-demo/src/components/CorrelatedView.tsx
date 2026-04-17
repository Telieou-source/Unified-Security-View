import type { CorrelatedAlert } from "../types";
import { DOMAINS, CORR_SEVERITY_STYLE } from "../data/config";

interface Props {
  alerts: CorrelatedAlert[];
  totalEvents: number;
  onAlertClick: (alert: CorrelatedAlert) => void;
}

function fmt(ts: number) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString([], { month: "2-digit", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  );
}

const DOMAIN_COLOR: Record<string, string> = {
  ALPHA: "#4ea6dc",
  BRAVO: "#48c78e",
  CHARLIE: "#c9a227",
};

const ALERT_TYPE_LABEL: Record<string, string> = {
  CORRELATED_THREAT:    "Correlated Threat",
  PATTERN_MATCH:        "Pattern Match",
  CROSS_DOMAIN_ANOMALY: "Cross-Domain Anomaly",
  SYNCHRONIZED_ACTIVITY:"Synchronized Activity",
};

export function CorrelatedView({ alerts, totalEvents, onAlertClick }: Props) {
  const critCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a) => a.severity === "HIGH").length;
  const medCount  = alerts.filter((a) => a.severity === "MEDIUM").length;

  return (
    <div
      className="rounded-sm border border-[#2d3035] overflow-hidden"
      style={{ background: "#14161a" }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[#2d3035]"
        style={{ background: "#1e2124" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-wide text-[#f58220]">
            HIGH SIDE CORRELATION — Notable Events
          </span>
          <span className="text-xs text-[#555a62] font-mono">Source: cross-domain-siem | sourcetype: notable</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-[#555a62]">{totalEvents} events ingested</span>
          <span className="text-[#e55555]">{critCount} CRITICAL</span>
          <span className="text-[#f58220]">{highCount} HIGH</span>
          <span className="text-[#e5c97a]">{medCount} MEDIUM</span>
          <span className="text-[#888c94]">{alerts.length} notables</span>
        </div>
      </div>

      {/* Domain contribution summary */}
      <div className="grid grid-cols-3 border-b border-[#1f2226]">
        {DOMAINS.map((domain) => {
          const domainAlerts = alerts.filter((a) => a.domains.includes(domain.id));
          const pct = alerts.length > 0 ? Math.round((domainAlerts.length / alerts.length) * 100) : 0;
          return (
            <div
              key={domain.id}
              className="flex items-center justify-between px-4 py-2 border-r border-[#1f2226] last:border-r-0"
              style={{ background: "#17191d" }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: domain.color }} />
                <span className="text-xs font-mono font-semibold" style={{ color: domain.color }}>
                  {domain.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#555a62]">
                <span>{domainAlerts.length} notables</span>
                <span>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Column headers */}
      <div
        className="grid text-xs font-semibold text-[#666b74] px-3 py-1.5 border-b border-[#1f2226]"
        style={{
          gridTemplateColumns: "130px 90px 90px 90px 1fr 64px 60px",
          background: "#191c20",
          letterSpacing: "0.04em",
        }}
      >
        <span>Time</span>
        <span>Rule ID</span>
        <span>Type</span>
        <span>Domains</span>
        <span>Summary</span>
        <span className="text-right">Confidence</span>
        <span className="text-right">Action</span>
      </div>

      {/* Alert rows */}
      <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-[#444850]">
            <span className="text-2xl">◎</span>
            <span className="text-xs font-mono">No notables — start simulation to detect cross-domain correlation</span>
          </div>
        ) : (
          alerts.slice(0, 25).map((alert, i) => {
            const sev = CORR_SEVERITY_STYLE[alert.severity];
            const isNew = i === 0;
            return (
              <div
                key={alert.id}
                onClick={() => onAlertClick(alert)}
                className={`grid text-xs font-mono px-3 py-2.5 hover:bg-[#1c2530] cursor-pointer transition-colors group ${isNew ? "corr-new" : ""}`}
                style={{
                  gridTemplateColumns: "130px 90px 90px 90px 1fr 64px 60px",
                  background: isNew ? undefined : i % 2 === 0 ? "#14161a" : "#171a1e",
                  borderBottom: "1px solid #1a1c20",
                  borderLeft: `3px solid ${sev.color}`,
                }}
                title="Click to open alert detail"
              >
                <span className="text-[#555a62]">{fmt(alert.timestamp)}</span>
                <span className="text-[#a78bfa]">{alert.ruleId}</span>
                <span className="text-[#8a9aaa] truncate">{ALERT_TYPE_LABEL[alert.type]}</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {alert.domains.map((did) => (
                    <span
                      key={did}
                      className="text-xs px-1 rounded-sm font-semibold"
                      style={{ color: DOMAIN_COLOR[did], background: `${DOMAIN_COLOR[did]}18`, border: `1px solid ${DOMAIN_COLOR[did]}35` }}
                    >
                      {did}
                    </span>
                  ))}
                </div>
                <span
                  className="truncate leading-relaxed pr-2"
                  style={{ color: alert.severity === "CRITICAL" ? "#e55555" : alert.severity === "HIGH" ? "#f58220" : "#e5c97a" }}
                  title={alert.summary}
                >
                  {alert.summary}
                </span>
                <span className="text-right text-[#888c94]">{alert.confidence}%</span>
                <span className="text-right text-[#3a4a5a] group-hover:text-[#4ea6dc] transition-colors select-none">
                  Open →
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
