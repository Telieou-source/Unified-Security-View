import { useState, useEffect, useRef } from "react";

type NavTab = "search" | "dashboards" | "reports";

interface Props {
  activeTab: NavTab | null;
  onClose: () => void;
}

/* ── SEARCH ── */
const PRESET_QUERIES = [
  'index=cross_domain_siem severity=FATAL | stats count by domain',
  'index=cross_domain_siem eventtype=ExfilAttempt | table _time host srcIp userId',
  'index=cross_domain_siem | eval cross=if(domain!="",1,0) | stats dc(domain) as domains by userId | where domains>1',
  'index=cross_domain_siem eventtype=PrivilegeEsc | timechart count by domain',
  'index=cross_domain_siem | stats latest(_time) as last_seen by host | sort -last_seen',
];

const TIME_RANGES = [
  "Last 15 minutes",
  "Last 60 minutes",
  "Last 4 hours",
  "Last 24 hours",
  "Last 7 days",
  "All time",
];

function SearchPanel() {
  const [query, setQuery] = useState("");
  const [timeRange, setTimeRange] = useState("Last 60 minutes");
  const [ran, setRan] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-xs font-semibold text-[#888c94] tracking-wider mb-1">SEARCH</div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-3 rounded-sm"
          style={{ background: "#0e1012", border: "1px solid #3a3d45" }}
        >
          <span className="text-[#f58220] text-xs font-mono">|</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setRan(true)}
            placeholder='index=cross_domain_siem | stats count by domain, eventtype'
            className="flex-1 bg-transparent text-xs font-mono text-[#c8d0d8] placeholder-[#3a3d45] outline-none py-2"
          />
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-2 py-1 text-xs font-mono text-[#c8d0d8] rounded-sm cursor-pointer"
          style={{ background: "#1e2124", border: "1px solid #3a3d45" }}
        >
          {TIME_RANGES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button
          onClick={() => setRan(true)}
          className="px-4 py-1 rounded-sm text-xs font-semibold"
          style={{ background: "#f58220", color: "#111315" }}
        >
          Search
        </button>
      </div>

      {/* Result hint */}
      {ran && (
        <div
          className="px-3 py-2 rounded-sm text-xs font-mono text-[#48c78e]"
          style={{ background: "#151e18", border: "1px solid #264a38" }}
        >
          Query dispatched to cross_domain_siem index — results appear in the main view below.
        </div>
      )}

      {/* Preset queries */}
      <div>
        <div className="text-xs text-[#555a62] mb-2 font-mono">Preset queries</div>
        <div className="flex flex-col gap-1">
          {PRESET_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => { setQuery(q); setRan(false); inputRef.current?.focus(); }}
              className="text-left px-3 py-1.5 rounded-sm text-xs font-mono text-[#7a8490] hover:text-[#c8d0d8] transition-colors"
              style={{ background: "#1a1c20", border: "1px solid #2a2d32" }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── DASHBOARDS ── */
const DASHBOARDS = [
  {
    id: "threat-overview",
    title: "Threat Overview",
    desc: "Real-time severity distribution, top event types, and CRITICAL/FATAL alert counts across all domains.",
    tags: ["overview", "threats"],
    updated: "Live",
  },
  {
    id: "domain-activity",
    title: "Domain Activity Monitor",
    desc: "Per-domain event volume, ingest rate trends, and anomaly spikes over the selected time window.",
    tags: ["domains", "volume"],
    updated: "Live",
  },
  {
    id: "network-analysis",
    title: "Network Connection Analysis",
    desc: "Top source IPs, destination port distribution, protocol breakdown, and beaconing pattern detection.",
    tags: ["network", "connections"],
    updated: "Live",
  },
  {
    id: "user-behavior",
    title: "User Behavior Analytics",
    desc: "User activity frequency, cross-domain account usage, privilege escalation tracking by identity.",
    tags: ["UBA", "identity"],
    updated: "Live",
  },
  {
    id: "incident-timeline",
    title: "Incident Timeline",
    desc: "Chronological view of correlated notable events with rule IDs, involved domains, and confidence scores.",
    tags: ["incidents", "timeline"],
    updated: "Live",
  },
  {
    id: "exec-summary",
    title: "Executive Summary",
    desc: "High-level rollup: total events, guard sanitization rate, unique threat patterns, and open notables.",
    tags: ["executive", "summary"],
    updated: "Live",
  },
];

function DashboardsPanel({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#888c94] tracking-wider">DASHBOARDS</span>
        <button
          onClick={() => setShowCustomize(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold transition-colors"
          style={{ background: "#1e2124", color: "#f58220", border: "1px solid #4a3a20" }}
        >
          + Customize Dashboard
        </button>
      </div>

      {showCustomize && (
        <div
          className="px-3 py-2.5 rounded-sm text-xs font-mono"
          style={{ background: "#1a1c14", border: "1px solid #3a3c1a" }}
        >
          <div className="text-[#c9a227] font-semibold mb-1">Dashboard Builder</div>
          <div className="text-[#666b74]">
            Drag panels from the library, configure data sources, set refresh intervals,
            and choose visualization types. Save as a new named dashboard or overwrite an existing one.
          </div>
          <button
            onClick={() => setShowCustomize(false)}
            className="mt-2 text-xs text-[#555a62] hover:text-[#888c94]"
          >
            Dismiss
          </button>
        </div>
      )}

      {selected && (
        <div
          className="px-3 py-2.5 rounded-sm text-xs font-mono"
          style={{ background: "#151e18", border: "1px solid #264a38" }}
        >
          <div className="text-[#48c78e] font-semibold mb-1">
            Opening: {DASHBOARDS.find((d) => d.id === selected)?.title}
          </div>
          <div className="text-[#555a62]">
            Dashboard loaded — navigate to the main view to see live panels.
          </div>
          <button onClick={() => { setSelected(null); onClose(); }} className="mt-1 text-xs text-[#f58220]">
            Go to dashboard →
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {DASHBOARDS.map((db) => (
          <button
            key={db.id}
            onClick={() => setSelected(db.id)}
            className="text-left rounded-sm p-3 transition-colors"
            style={{
              background: selected === db.id ? "#1a2630" : "#1a1c20",
              border: `1px solid ${selected === db.id ? "#2a4a70" : "#2a2d32"}`,
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-[#c8d0d8]">{db.title}</span>
              <span
                className="text-xs px-1 rounded-sm flex-shrink-0 font-mono"
                style={{ background: "#1a3020", color: "#48c78e", border: "1px solid #264a38" }}
              >
                {db.updated}
              </span>
            </div>
            <p className="text-xs text-[#666b74] leading-relaxed">{db.desc}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {db.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-1.5 rounded-sm font-mono"
                  style={{ background: "#222528", color: "#555a62", border: "1px solid #2d3035" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── REPORTS ── */
const REPORTS = [
  {
    id: "correlation-report",
    title: "Cross-Domain Correlation Report",
    desc: "Full breakdown of correlated notable events, rule matches, confidence scores, and involved domains.",
    schedule: "On demand",
    format: "PDF / CSV",
    severity: "HIGH",
  },
  {
    id: "threat-intel",
    title: "Threat Intelligence Summary",
    desc: "Aggregated threat indicators observed across all domains: IPs, users, event patterns, and MITRE ATT&CK mappings.",
    schedule: "Daily",
    format: "PDF",
    severity: "CRITICAL",
  },
  {
    id: "compliance-audit",
    title: "Compliance Audit Log",
    desc: "Policy violation events, boundary crossing records, and sanitization activity for audit and compliance purposes.",
    schedule: "Weekly",
    format: "PDF / JSON",
    severity: "MEDIUM",
  },
  {
    id: "incident-timeline",
    title: "Incident Response Timeline",
    desc: "Chronological incident narrative with event chains, timestamps, affected hosts, and recommended remediation steps.",
    schedule: "Per incident",
    format: "PDF",
    severity: "HIGH",
  },
  {
    id: "user-access",
    title: "User Access Review",
    desc: "Cross-domain user activity, privilege escalation events, and anomalous identity behavior over the reporting period.",
    schedule: "Monthly",
    format: "CSV / XLSX",
    severity: "MEDIUM",
  },
  {
    id: "network-anomaly",
    title: "Network Anomaly Report",
    desc: "Unusual connection patterns, port scan indicators, beaconing detection, and lateral movement signatures.",
    schedule: "Weekly",
    format: "PDF",
    severity: "HIGH",
  },
];

const SEV_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#e55555", bg: "#2d0e0e", border: "#6a2020" },
  HIGH:     { color: "#f58220", bg: "#2d1a08", border: "#6a3a10" },
  MEDIUM:   { color: "#e5c97a", bg: "#2d2510", border: "#5a4a20" },
};

function ReportsPanel() {
  const [opening, setOpening] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#888c94] tracking-wider">REPORTS</span>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold transition-colors"
          style={{ background: "#1e2124", color: "#f58220", border: "1px solid #4a3a20" }}
        >
          + Create Report
        </button>
      </div>

      {showCreate && (
        <div
          className="px-3 py-2.5 rounded-sm text-xs font-mono"
          style={{ background: "#1a1c14", border: "1px solid #3a3c1a" }}
        >
          <div className="text-[#c9a227] font-semibold mb-2">New Report</div>
          <div className="grid grid-cols-3 gap-2">
            {["Name", "Data Source", "Schedule"].map((label) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-[#555a62]">{label}</span>
                <input
                  placeholder={label === "Name" ? "My Report" : label === "Data Source" ? "cross_domain_siem" : "Weekly"}
                  className="bg-[#0e1012] border border-[#3a3d45] rounded-sm px-2 py-1 text-xs text-[#c8d0d8] outline-none font-mono"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              className="px-3 py-1 rounded-sm text-xs font-semibold"
              style={{ background: "#f58220", color: "#111315" }}
              onClick={() => setShowCreate(false)}
            >
              Save Report
            </button>
            <button onClick={() => setShowCreate(false)} className="text-xs text-[#555a62] hover:text-[#888c94] px-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {opening && (
        <div
          className="px-3 py-2 rounded-sm text-xs font-mono"
          style={{ background: "#151e18", border: "1px solid #264a38" }}
        >
          <span className="text-[#48c78e]">Generating report: </span>
          <span className="text-[#c8d0d8]">{REPORTS.find((r) => r.id === opening)?.title}</span>
          <span className="text-[#555a62]"> — available for download shortly.</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {REPORTS.map((rpt) => {
          const sev = SEV_STYLE[rpt.severity];
          return (
            <button
              key={rpt.id}
              onClick={() => setOpening(rpt.id)}
              className="text-left rounded-sm px-3 py-2.5 transition-colors hover:bg-[#1e2124] flex items-start gap-4"
              style={{
                background: opening === rpt.id ? "#1a2630" : "#1a1c20",
                border: `1px solid ${opening === rpt.id ? "#2a4a70" : "#2a2d32"}`,
                borderLeft: `3px solid ${sev.color}`,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-[#c8d0d8]">{rpt.title}</span>
                  <span
                    className="text-xs px-1.5 rounded-sm font-mono flex-shrink-0"
                    style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
                  >
                    {rpt.severity}
                  </span>
                </div>
                <p className="text-xs text-[#666b74] leading-relaxed">{rpt.desc}</p>
              </div>
              <div className="flex-shrink-0 text-right text-xs font-mono text-[#555a62] mt-0.5 space-y-1">
                <div>{rpt.schedule}</div>
                <div className="text-[#3a3d45]">{rpt.format}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── ROOT ── */
export type { NavTab };

export function NavPanel({ activeTab, onClose }: Props) {
  if (!activeTab) return null;

  return (
    <div
      className="border-b border-[#2d3035] flex-shrink-0 overflow-y-auto"
      style={{ background: "#14161a", maxHeight: "420px" }}
    >
      {activeTab === "search"     && <SearchPanel />}
      {activeTab === "dashboards" && <DashboardsPanel onClose={onClose} />}
      {activeTab === "reports"    && <ReportsPanel />}
    </div>
  );
}
