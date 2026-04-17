import { useState, useEffect, useRef } from "react";

type NavTab = "search" | "dashboards" | "reports" | "investigations";

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
                borderTop: `1px solid ${opening === rpt.id ? "#2a4a70" : "#2a2d32"}`,
                borderRight: `1px solid ${opening === rpt.id ? "#2a4a70" : "#2a2d32"}`,
                borderBottom: `1px solid ${opening === rpt.id ? "#2a4a70" : "#2a2d32"}`,
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

/* ── INVESTIGATIONS ── */
type InvStatus = "Open" | "In Progress" | "Closed";

interface Investigation {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: InvStatus;
  analyst: string;
  opened: string;
  domains: string[];
  summary: string;
  keyFindings: string[];
  timeline: { time: string; event: string }[];
  notes: string;
}

const STATUS_STYLE: Record<InvStatus, { color: string; bg: string; border: string }> = {
  "Open":        { color: "#e55555", bg: "#2d0e0e", border: "#6a2020" },
  "In Progress": { color: "#f58220", bg: "#2d1a08", border: "#6a3a10" },
  "Closed":      { color: "#48c78e", bg: "#0e2a1a", border: "#1e5a30" },
};

const INV_SEV_COLOR: Record<string, string> = {
  CRITICAL: "#e55555",
  HIGH:     "#f58220",
  MEDIUM:   "#e5c97a",
};

const DOMAIN_COLOR_INV: Record<string, string> = {
  ALPHA:   "#4ea6dc",
  BRAVO:   "#48c78e",
  CHARLIE: "#c9a227",
};

const INVESTIGATIONS: Investigation[] = [
  {
    id: "INV-2024-001",
    title: "Multi-Domain Credential Stuffing Campaign",
    severity: "CRITICAL",
    status: "Open",
    analyst: "Unassigned",
    opened: "2024-04-14 08:32 UTC",
    domains: ["ALPHA", "BRAVO", "CHARLIE"],
    summary:
      "Automated credential testing detected across all three classification domains within a 4-minute window. 847 authentication attempts sourced from rotating IPs matching known threat-actor infrastructure. Consistent user-agent spoofing and timing jitter suggest automated tooling.",
    keyFindings: [
      "847 failed logins across 3 domains in 4 minutes",
      "Rotating source IPs across 18 distinct /24 ranges",
      "6 successful authentications before lockout triggered",
      "Same usernames targeted across all domains",
      "Traffic pattern matches Credential Stuffing Kit v3 signatures",
    ],
    timeline: [
      { time: "08:27:04", event: "First failed auth on Domain ALPHA (usr_j.harris)" },
      { time: "08:28:11", event: "Domain BRAVO authentication spike — 120 failures/min" },
      { time: "08:29:43", event: "Domain CHARLIE lockout policy triggered for 3 accounts" },
      { time: "08:30:55", event: "Cross-domain correlation fired: CDCA-9912 (CRITICAL)" },
      { time: "08:31:20", event: "SOC alerted — automated investigation opened" },
    ],
    notes: "Pending analyst assignment. Firewall block rules requested for identified /24 ranges.",
  },
  {
    id: "INV-2024-002",
    title: "Cross-Domain Lateral Movement — ALPHA → CHARLIE",
    severity: "HIGH",
    status: "In Progress",
    analyst: "M. Okonkwo",
    opened: "2024-04-15 13:18 UTC",
    domains: ["ALPHA", "CHARLIE"],
    summary:
      "A compromised service account originating in Domain ALPHA was used to access resources in Domain CHARLIE via a trusted cross-domain relay. Network telemetry shows reconnaissance activity followed by file access events on classified shares.",
    keyFindings: [
      "Service account svc_relay_01 authenticated from non-standard host",
      "12 file access events on Domain CHARLIE restricted share",
      "SMB lateral movement signatures detected on boundary relay",
      "Account last used 47 days prior to this event",
      "No associated change request or maintenance window",
    ],
    timeline: [
      { time: "13:02:17", event: "svc_relay_01 login from alpha-ws-0044 (unusual host)" },
      { time: "13:05:33", event: "Cross-domain relay connection established ALPHA→CHARLIE" },
      { time: "13:09:48", event: "FileAccess on \\\\charlie-fs-02\\classified\\ops — 12 reads" },
      { time: "13:14:02", event: "Exfil pattern flagged by DLP engine (4.2 MB staged)" },
      { time: "13:18:40", event: "Correlation rule CDLM-0317 fired — investigation opened" },
    ],
    notes:
      "Account svc_relay_01 suspended. Memory image collected from alpha-ws-0044. Forensic analysis underway.",
  },
  {
    id: "INV-2024-003",
    title: "Synchronized Privilege Escalation Event",
    severity: "HIGH",
    status: "Closed",
    analyst: "T. Vasquez",
    opened: "2024-04-10 22:04 UTC",
    domains: ["BRAVO", "CHARLIE"],
    summary:
      "Coordinated privilege escalation observed on Domains BRAVO and CHARLIE within a 90-second window. Two separate accounts exploited a local scheduler vulnerability to gain SYSTEM-level access. Confirmed as an authorized red-team exercise.",
    keyFindings: [
      "PrivilegeEsc events on both domains within 90s",
      "Exploited CVE-2024-1112 (task scheduler bypass)",
      "SYSTEM privileges acquired on 2 hosts",
      "Cross-domain timing correlation confidence: 94%",
      "Confirmed authorized: Red Team Op RT-2024-07",
    ],
    timeline: [
      { time: "21:58:12", event: "Scheduled task created on bravo-srv-11 (non-standard)" },
      { time: "21:59:44", event: "SYSTEM process spawned — PrivilegeEsc on bravo-srv-11" },
      { time: "22:01:07", event: "Identical escalation on charlie-ws-03" },
      { time: "22:04:30", event: "Correlation fired CDPE-5501 — investigation opened" },
      { time: "22:31:00", event: "Red team provided change ticket RT-2024-07 — closed" },
    ],
    notes: "Closed — authorized red team activity. Vulnerability patched on both domains (patch KB2024-0418).",
  },
  {
    id: "INV-2024-004",
    title: "Anomalous Bulk Data Access — Domain BRAVO",
    severity: "MEDIUM",
    status: "In Progress",
    analyst: "A. Petrov",
    opened: "2024-04-16 09:47 UTC",
    domains: ["BRAVO"],
    summary:
      "User account usr_k.chen accessed 2,400% more files than their 30-day baseline within a single working session. Access pattern is sequential and systematic, consistent with bulk enumeration rather than normal work activity.",
    keyFindings: [
      "1,847 FileAccess events in 2.5 hours (baseline: 76/day)",
      "Sequential file enumeration pattern detected",
      "Access spread across 14 different project directories",
      "User has no open tickets or project assignments for accessed files",
      "USB device connected 8 minutes into the session",
    ],
    timeline: [
      { time: "09:12:04", event: "usr_k.chen workstation login (normal hours)" },
      { time: "09:20:17", event: "USB mass storage device connected" },
      { time: "09:21:00", event: "Bulk FileAccess begins — 12 files/min escalating to 40/min" },
      { time: "09:47:22", event: "UBA anomaly rule UBA-2201 fires — investigation opened" },
      { time: "11:44:30", event: "Session ends — 1,847 total file accesses logged" },
    ],
    notes:
      "HR and security manager notified. Workstation imaged. User placed on restricted access pending review.",
  },
  {
    id: "INV-2024-005",
    title: "Policy Violation: Unauthorized C2 Protocol Usage",
    severity: "MEDIUM",
    status: "Open",
    analyst: "Unassigned",
    opened: "2024-04-17 06:15 UTC",
    domains: ["ALPHA"],
    summary:
      "Network telemetry detected DNS-over-HTTPS traffic to an uncategorized external resolver from a Domain ALPHA workstation. The destination IP matches a known command-and-control infrastructure indicator from a recent threat intelligence feed.",
    keyFindings: [
      "DoH traffic to 185.220.x.x (TI feed: C2 indicator)",
      "Beaconing pattern: 60s interval, 312-byte payload",
      "7-hour continuous session before detection",
      "Host: alpha-ws-0109 (assigned to cleared contractor)",
      "No legitimate business use case for external DNS resolver",
    ],
    timeline: [
      { time: "23:08:44", event: "First DoH connection to 185.220.101.47" },
      { time: "23:09:44", event: "Second connection — 60s beacon confirmed" },
      { time: "06:08:12", event: "TI feed updated — IP flagged as C2 indicator" },
      { time: "06:12:30", event: "Correlation engine matched: NetworkConn + TI hit" },
      { time: "06:15:00", event: "Policy violation alert POL-8814 fired — investigation opened" },
    ],
    notes: "Pending analyst assignment. Host quarantined automatically by EDR at 06:16 UTC.",
  },
];

function InvestigationsPanel() {
  const [selected, setSelected] = useState<Investigation | null>(null);

  if (selected) {
    const sev = INV_SEV_COLOR[selected.severity];
    const st = STATUS_STYLE[selected.status];
    return (
      <div className="flex flex-col gap-4 p-4">
        {/* Back */}
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-xs font-mono text-[#555a62] hover:text-[#c8d0d8] self-start"
        >
          ← All Investigations
        </button>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[#a78bfa]">{selected.id}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm font-mono" style={{ background: `${sev}18`, color: sev, border: `1px solid ${sev}40` }}>
              {selected.severity}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm font-mono" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {selected.status}
            </span>
          </div>
          <div className="text-sm font-semibold text-[#c8d0d8]">{selected.title}</div>
          <div className="flex items-center gap-4 text-xs font-mono text-[#555a62]">
            <span>Analyst: <span className="text-[#8a9aaa]">{selected.analyst}</span></span>
            <span>Opened: <span className="text-[#8a9aaa]">{selected.opened}</span></span>
          </div>
          <div className="flex gap-1.5">
            {selected.domains.map((d) => (
              <span key={d} className="text-xs font-semibold px-2 py-0.5 rounded-sm font-mono"
                style={{ color: DOMAIN_COLOR_INV[d], background: `${DOMAIN_COLOR_INV[d]}18`, border: `1px solid ${DOMAIN_COLOR_INV[d]}35` }}>
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="text-xs font-semibold text-[#555a62] tracking-wider uppercase mb-1.5">Summary</div>
          <p className="text-xs text-[#8a9aaa] leading-relaxed">{selected.summary}</p>
        </div>

        {/* Key findings */}
        <div>
          <div className="text-xs font-semibold text-[#555a62] tracking-wider uppercase mb-1.5">Key Findings</div>
          <ul className="flex flex-col gap-1">
            {selected.keyFindings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#8a9aaa]">
                <span className="flex-shrink-0 mt-0.5" style={{ color: sev }}>▸</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Timeline */}
        <div>
          <div className="text-xs font-semibold text-[#555a62] tracking-wider uppercase mb-1.5">Event Timeline</div>
          <div className="flex flex-col gap-0">
            {selected.timeline.map((t, i) => (
              <div key={i} className="flex gap-3 text-xs font-mono">
                <span className="text-[#555a62] flex-shrink-0">{t.time}</span>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sev }} />
                  <span className="text-[#8a9aaa] pb-2">{t.event}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analyst notes */}
        <div>
          <div className="text-xs font-semibold text-[#555a62] tracking-wider uppercase mb-1.5">Analyst Notes</div>
          <div className="px-3 py-2 rounded-sm text-xs text-[#7a8490] font-mono leading-relaxed"
            style={{ background: "#0e1012", border: "1px solid #2a2d32" }}>
            {selected.notes}
          </div>
        </div>

        <div className="pb-2" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#888c94] tracking-wider">INVESTIGATIONS</span>
        <div className="flex items-center gap-3 text-xs font-mono text-[#555a62]">
          <span><span className="text-[#e55555]">{INVESTIGATIONS.filter((i) => i.status === "Open").length}</span> open</span>
          <span><span className="text-[#f58220]">{INVESTIGATIONS.filter((i) => i.status === "In Progress").length}</span> in progress</span>
          <span><span className="text-[#48c78e]">{INVESTIGATIONS.filter((i) => i.status === "Closed").length}</span> closed</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {INVESTIGATIONS.map((inv) => {
          const sev = INV_SEV_COLOR[inv.severity];
          const st = STATUS_STYLE[inv.status];
          return (
            <button
              key={inv.id}
              onClick={() => setSelected(inv)}
              className="text-left rounded-sm px-3 py-3 transition-colors hover:bg-[#1e2226] flex items-start gap-4"
              style={{ background: "#1a1c20", borderTop: "1px solid #2a2d32", borderRight: "1px solid #2a2d32", borderBottom: "1px solid #2a2d32", borderLeft: `3px solid ${sev}` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-[#a78bfa]">{inv.id}</span>
                  <span className="text-xs font-semibold text-[#c8d0d8]">{inv.title}</span>
                </div>
                <p className="text-xs text-[#555a62] leading-relaxed line-clamp-1">{inv.summary}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {inv.domains.map((d) => (
                    <span key={d} className="text-xs px-1.5 rounded-sm font-mono font-semibold"
                      style={{ color: DOMAIN_COLOR_INV[d], background: `${DOMAIN_COLOR_INV[d]}18`, border: `1px solid ${DOMAIN_COLOR_INV[d]}35` }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-xs font-mono">
                <span className="px-2 py-0.5 rounded-sm font-semibold" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                  {inv.status}
                </span>
                <span className="text-[#555a62]">{inv.analyst}</span>
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
      {activeTab === "search"         && <SearchPanel />}
      {activeTab === "dashboards"     && <DashboardsPanel onClose={onClose} />}
      {activeTab === "reports"        && <ReportsPanel />}
      {activeTab === "investigations" && <InvestigationsPanel />}
    </div>
  );
}
