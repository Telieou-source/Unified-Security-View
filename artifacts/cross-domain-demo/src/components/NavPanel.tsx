import { useState, useEffect, useRef, useCallback } from "react";
import type { RawEvent } from "../types";
import { runQuery } from "../lib/search";
import type { ExecResult } from "../lib/search";
import {
  REPORT_ACTIONS, downloadFile,
  ALL_DOMAINS, ALL_SEVERITIES, ALL_EVENT_TYPES, ALL_FIELDS,
  generateCustomCSV, generateCustomTXT, filterEvents,
} from "../lib/reports";
import type { CustomReportConfig } from "../lib/reports";

type NavTab = "search" | "dashboards" | "reports" | "investigations";

interface Props {
  activeTab: NavTab | null;
  onClose: () => void;
  rawEvents: RawEvent[];
  onOpenDashboard?: (id: string) => void;
}

/* ── SEARCH ── */

const PRESET_QUERIES = [
  { label: "FATAL events by domain",         q: 'index=cross_domain_siem severity=FATAL | stats count by domain' },
  { label: "ExfilAttempt event detail",       q: 'index=cross_domain_siem eventtype=ExfilAttempt | table _time host srcIp userId' },
  { label: "Cross-domain accounts (>1 domain)", q: 'index=cross_domain_siem | eval cross=if(domain!="",1,0) | stats dc(domain) as domains by userId | where domains>1' },
  { label: "Privilege escalations over time", q: 'index=cross_domain_siem eventtype=PrivilegeEsc | timechart count by domain' },
  { label: "Latest activity by host",         q: 'index=cross_domain_siem | stats latest(_time) as last_seen by host | sort -last_seen' },
];

const TIME_RANGES = [
  "Last 15 minutes",
  "Last 60 minutes",
  "Last 4 hours",
  "Last 24 hours",
  "Last 7 days",
  "All time",
];

const SEV_COLOR: Record<string, string> = {
  INFO:  "#8eb8d4",
  WARN:  "#e5c97a",
  ERROR: "#f58220",
  FATAL: "#e55555",
};

const DOMAIN_COLOR: Record<string, string> = {
  ALPHA:   "#4ea6dc",
  BRAVO:   "#48c78e",
  CHARLIE: "#c9a227",
};

function cellColor(col: string, val: string): string | undefined {
  if (col === "severity") return SEV_COLOR[val];
  if (col === "domain")   return DOMAIN_COLOR[val];
  return undefined;
}

function SearchPanel({ events }: { events: RawEvent[] }) {
  const [query, setQuery]       = useState("");
  const [timeRange, setTimeRange] = useState("All time");
  const [result, setResult]     = useState<ExecResult | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = useCallback(() => {
    const r = runQuery(query, events, timeRange);
    setResult(r);
    setInputError(!r.ok ? r.error : null);
  }, [query, events, timeRange]);

  const handleTimeChange = (newRange: string) => {
    setTimeRange(newRange);
    if (result) {
      const r = runQuery(query, events, newRange);
      setResult(r);
      setInputError(!r.ok ? r.error : null);
    }
  };

  const loadPreset = (q: string) => {
    setQuery(q);
    setResult(null);
    setInputError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const hasResult = result?.ok === true;
  const hasError  = result?.ok === false || !!inputError;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-xs font-semibold text-[#888c94] tracking-wider mb-1">SEARCH</div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div
          className="flex-1 flex items-center gap-2 px-3 rounded-sm transition-colors"
          style={{
            background: "#0e1012",
            border: `1px solid ${hasError ? "#6a2020" : "#3a3d45"}`,
          }}
        >
          <span className="text-[#f58220] text-xs font-mono flex-shrink-0">|</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setInputError(null); if (result) setResult(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="index=cross_domain_siem | stats count by domain, eventtype"
            className="flex-1 bg-transparent text-xs font-mono text-[#c8d0d8] placeholder-[#3a3d45] outline-none py-2"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResult(null); setInputError(null); inputRef.current?.focus(); }}
              className="text-[#555a62] hover:text-[#e55555] text-xs flex-shrink-0"
              title="Clear"
            >✕</button>
          )}
        </div>
        <select
          value={timeRange}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="px-2 py-1 text-xs font-mono text-[#c8d0d8] rounded-sm cursor-pointer"
          style={{ background: "#1e2124", border: "1px solid #3a3d45" }}
        >
          {TIME_RANGES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-1 rounded-sm text-xs font-semibold flex-shrink-0"
          style={{ background: "#f58220", color: "#111315" }}
        >
          Search
        </button>
      </div>

      {/* Error banner */}
      {hasError && result && !result.ok && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded-sm text-xs font-mono"
          style={{ background: "#2d0e0e", border: "1px solid #6a2020" }}
        >
          <span className="text-[#e55555] flex-shrink-0 mt-0.5">✕</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[#e55555] font-semibold">{result.error}</span>
            {result.hint && <span className="text-[#8a4a4a]">{result.hint}</span>}
          </div>
        </div>
      )}

      {/* Results */}
      {hasResult && result.ok && (
        <div className="flex flex-col gap-2">
          {/* Result meta bar */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-[#48c78e] font-semibold">{result.summary}</span>
              <span className="text-[#555a62]">
                {result.type === "timechart" ? "Time chart" : result.type === "stats" ? "Statistics" : "Table"}
              </span>
              <span className="text-[#3a3d45]">|</span>
              <span className="text-[#555a62]">Time: {timeRange}</span>
            </div>
            <span className="text-[#3a3d45]">{result.queryMs}ms</span>
          </div>

          {/* Results table */}
          <div
            className="overflow-auto rounded-sm"
            style={{ maxHeight: "220px", border: "1px solid #2a2d32" }}
          >
            {result.rows.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-xs font-mono text-[#444850]">
                No results — try a different time range or query
              </div>
            ) : (
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr style={{ background: "#191c20", borderBottom: "1px solid #2a2d32" }}>
                    {result.columns.map((col) => (
                      <th
                        key={col}
                        className="text-left px-3 py-1.5 font-semibold text-[#666b74] whitespace-nowrap"
                        style={{ letterSpacing: "0.04em" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      style={{ background: ri % 2 === 0 ? "#14161a" : "#171a1e", borderBottom: "1px solid #1a1c20" }}
                    >
                      {row.map((cell, ci) => {
                        const col = result.columns[ci];
                        const color = cellColor(col, cell);
                        return (
                          <td
                            key={ci}
                            className="px-3 py-1.5 whitespace-nowrap"
                            style={{ color: color ?? "#8a9aaa", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis" }}
                            title={cell}
                          >
                            {color ? (
                              <span className="font-semibold" style={{ color }}>{cell}</span>
                            ) : cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Preset queries */}
      <div>
        <div className="text-xs text-[#555a62] mb-2 font-mono">Preset queries — click to load, press Search to run</div>
        <div className="flex flex-col gap-1">
          {PRESET_QUERIES.map(({ label, q }) => (
            <button
              key={q}
              onClick={() => loadPreset(q)}
              className="text-left px-3 py-2 rounded-sm transition-colors"
              style={{
                background: query === q ? "#1a2226" : "#1a1c20",
                border: `1px solid ${query === q ? "#2a4a60" : "#2a2d32"}`,
              }}
            >
              <div className="text-xs text-[#8a9aaa] font-semibold mb-0.5">{label}</div>
              <div className="text-xs font-mono text-[#555a62] truncate">{q}</div>
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

function DashboardsPanel({
  onOpenDashboard,
}: {
  onOpenDashboard?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#888c94] tracking-wider">DASHBOARDS</span>
        <span className="text-xs font-mono text-[#555a62]">Click a dashboard to open it</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DASHBOARDS.map((db) => (
          <button
            key={db.id}
            onClick={() => onOpenDashboard?.(db.id)}
            className="text-left rounded-sm p-3 transition-all hover:scale-[1.01]"
            style={{
              background: "#1a1c20",
              border: "1px solid #2a2d32",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#f5822060";
              (e.currentTarget as HTMLElement).style.background = "#1e2124";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#2a2d32";
              (e.currentTarget as HTMLElement).style.background = "#1a1c20";
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
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1 flex-wrap">
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
              <span className="text-xs font-mono text-[#f58220] opacity-70 flex-shrink-0">Open →</span>
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

const DEFAULT_CUSTOM: CustomReportConfig = {
  name:       "Custom Report",
  domains:    [...ALL_DOMAINS],
  severities: [...ALL_SEVERITIES],
  eventTypes: [...ALL_EVENT_TYPES],
  timeRange:  "All time",
  fields:     ["timestamp", "domain", "severity", "event_type", "user_id", "host", "src_ip", "dst_ip", "dst_port"],
  sortBy:     "timestamp",
  sortDir:    "desc",
};

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function CheckPill({
  label, active, color, onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded-sm text-xs font-mono font-semibold transition-colors flex-shrink-0"
      style={{
        background: active ? (color ? `${color}22` : "#1e3040") : "#1a1c20",
        color:      active ? (color ?? "#f58220")               : "#555a62",
        border:     `1px solid ${active ? (color ?? "#f58220") + "60" : "#2a2d32"}`,
      }}
    >
      {label}
    </button>
  );
}

const SEV_PILL: Record<string, string> = { FATAL: "#e55555", ERROR: "#f58220", WARN: "#e5c97a", INFO: "#8eb8d4" };
const DOM_PILL: Record<string, string> = { ALPHA: "#4ea6dc", BRAVO: "#48c78e", CHARLIE: "#c9a227" };

function CustomReportBuilder({ events, onDownloaded }: { events: RawEvent[]; onDownloaded: () => void }) {
  const [cfg, setCfg] = useState<CustomReportConfig>(DEFAULT_CUSTOM);
  const [fmt, setFmt] = useState<"csv" | "txt">("csv");

  const matchCount = filterEvents(events, cfg).length;

  function handleGenerate() {
    const content  = fmt === "csv" ? generateCustomCSV(events, cfg) : generateCustomTXT(events, cfg);
    const safeName = cfg.name.replace(/[^a-z0-9_-]/gi, "_").toLowerCase() || "custom_report";
    downloadFile(content, `${safeName}_${new Date().toISOString().slice(0, 10)}.${fmt}`, fmt === "csv" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;");
    onDownloaded();
  }

  const sectionHd = "text-xs font-semibold text-[#888c94] tracking-wider mb-2";
  const inputCls  = "w-full bg-[#0e1012] border border-[#3a3d45] rounded-sm px-2 py-1 text-xs text-[#c8d0d8] outline-none font-mono focus:border-[#f58220]";
  const selectCls = "bg-[#0e1012] border border-[#3a3d45] rounded-sm px-2 py-1 text-xs text-[#c8d0d8] outline-none font-mono focus:border-[#f58220] cursor-pointer";

  return (
    <div
      className="rounded-sm p-4 flex flex-col gap-4"
      style={{ background: "#13151a", border: "1px solid #f5822030", borderLeft: "3px solid #f58220" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#f58220]">+ Custom Report</span>
          <span
            className="text-xs font-mono px-1.5 rounded-sm"
            style={{
              background: matchCount > 0 ? "#1a3020" : "#2d0e0e",
              color:      matchCount > 0 ? "#48c78e" : "#e55555",
              border:     `1px solid ${matchCount > 0 ? "#264a38" : "#6a2020"}`,
            }}
          >
            {matchCount} event{matchCount !== 1 ? "s" : ""} match
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Report name */}
          <div>
            <div className={sectionHd}>REPORT NAME</div>
            <input
              className={inputCls}
              value={cfg.name}
              onChange={(e) => setCfg({ ...cfg, name: e.target.value })}
              placeholder="My Custom Report"
            />
          </div>

          {/* Domains */}
          <div>
            <div className={sectionHd}>DOMAINS</div>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DOMAINS.map((d) => (
                <CheckPill
                  key={d} label={d} active={cfg.domains.includes(d)} color={DOM_PILL[d]}
                  onClick={() => setCfg({ ...cfg, domains: toggle(cfg.domains, d) })}
                />
              ))}
            </div>
          </div>

          {/* Severities */}
          <div>
            <div className={sectionHd}>SEVERITY</div>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_SEVERITIES.map((s) => (
                <CheckPill
                  key={s} label={s} active={cfg.severities.includes(s)} color={SEV_PILL[s]}
                  onClick={() => setCfg({ ...cfg, severities: toggle(cfg.severities, s) })}
                />
              ))}
            </div>
          </div>

          {/* Event types */}
          <div>
            <div className={sectionHd}>EVENT TYPES</div>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_EVENT_TYPES.map((t) => (
                <CheckPill
                  key={t} label={t} active={cfg.eventTypes.includes(t)}
                  onClick={() => setCfg({ ...cfg, eventTypes: toggle(cfg.eventTypes, t) })}
                />
              ))}
            </div>
          </div>

          {/* Time range + sort */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={sectionHd}>TIME RANGE</div>
              <select className={selectCls} value={cfg.timeRange} onChange={(e) => setCfg({ ...cfg, timeRange: e.target.value })}>
                {["Last 15 minutes","Last 60 minutes","Last 4 hours","Last 24 hours","Last 7 days","All time"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <div className={sectionHd}>SORT BY</div>
              <div className="flex gap-1">
                <select className={`${selectCls} flex-1`} value={cfg.sortBy} onChange={(e) => setCfg({ ...cfg, sortBy: e.target.value as CustomReportConfig["sortBy"] })}>
                  <option value="timestamp">Timestamp</option>
                  <option value="severity">Severity</option>
                  <option value="domain">Domain</option>
                </select>
                <button
                  onClick={() => setCfg({ ...cfg, sortDir: cfg.sortDir === "desc" ? "asc" : "desc" })}
                  className="px-2 rounded-sm text-xs font-mono text-[#8a9aaa]"
                  style={{ background: "#1e2124", border: "1px solid #3a3d45" }}
                  title="Toggle sort direction"
                >
                  {cfg.sortDir === "desc" ? "↓" : "↑"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Fields */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className={sectionHd} style={{ marginBottom: 0 }}>OUTPUT FIELDS</div>
            <div className="flex gap-2">
              <button
                onClick={() => setCfg({ ...cfg, fields: ALL_FIELDS.map((f) => f.key) })}
                className="text-xs font-mono text-[#555a62] hover:text-[#f58220]"
              >All</button>
              <span className="text-[#333840] text-xs">|</span>
              <button
                onClick={() => setCfg({ ...cfg, fields: ["timestamp", "domain", "severity", "event_type"] })}
                className="text-xs font-mono text-[#555a62] hover:text-[#f58220]"
              >Reset</button>
            </div>
          </div>
          <div
            className="flex flex-col gap-0.5 overflow-auto rounded-sm p-2"
            style={{ background: "#0e1012", border: "1px solid #2a2d32", maxHeight: "230px" }}
          >
            {ALL_FIELDS.map((f) => {
              const on = cfg.fields.includes(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => {
                    if (on && cfg.fields.length === 1) return;
                    setCfg({ ...cfg, fields: toggle(cfg.fields, f.key) });
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded-sm text-left transition-colors"
                  style={{ background: on ? "#1a2630" : "transparent" }}
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0 flex items-center justify-center text-xs"
                    style={{
                      background: on ? "#f58220" : "#1a1c20",
                      border:     `1px solid ${on ? "#f58220" : "#3a3d45"}`,
                    }}
                  >
                    {on && <span style={{ color: "#111315", fontSize: "9px", fontWeight: 900 }}>✓</span>}
                  </span>
                  <span className="text-xs font-mono" style={{ color: on ? "#c8d0d8" : "#555a62" }}>{f.label}</span>
                </button>
              );
            })}
          </div>
          <div className="text-xs font-mono text-[#444850]">
            {cfg.fields.length} field{cfg.fields.length !== 1 ? "s" : ""} selected
          </div>
        </div>
      </div>

      {/* Format + Generate */}
      <div className="flex items-center gap-3 pt-1 border-t border-[#2a2d32]">
        <div className="flex items-center gap-1 text-xs font-mono text-[#555a62]">Format:</div>
        {(["csv", "txt"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFmt(f)}
            className="px-3 py-1 rounded-sm text-xs font-mono font-semibold transition-colors"
            style={{
              background: fmt === f ? (f === "csv" ? "#1a3020" : "#2a2210") : "#1e2124",
              color:      fmt === f ? (f === "csv" ? "#48c78e"  : "#c9a227") : "#555a62",
              border:     `1px solid ${fmt === f ? (f === "csv" ? "#264a38" : "#4a3a10") : "#2a2d32"}`,
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleGenerate}
          disabled={matchCount === 0 || cfg.fields.length === 0}
          className="px-4 py-1.5 rounded-sm text-xs font-semibold font-mono flex items-center gap-1.5 transition-opacity"
          style={{
            background: matchCount === 0 || cfg.fields.length === 0 ? "#2a2d32" : "#f58220",
            color:      matchCount === 0 || cfg.fields.length === 0 ? "#555a62"  : "#111315",
            cursor:     matchCount === 0 || cfg.fields.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          ↓ Generate &amp; Download {fmt.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

function ReportsPanel({ events }: { events: RawEvent[] }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [lastDownload, setLastDownload] = useState<{ id: string; fmt: string } | null>(null);

  function handleDownload(reportId: string, fmt: "csv" | "txt") {
    const action = REPORT_ACTIONS[reportId];
    if (!action) return;
    const content  = fmt === "csv" ? action.csvContent(events) : action.txtContent(events);
    const filename = fmt === "csv" ? action.csvFilename : action.txtFilename;
    const mime     = fmt === "csv" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;";
    downloadFile(content, filename, mime);
    setLastDownload({ id: reportId, fmt });
    setTimeout(() => setLastDownload(null), 3000);
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#888c94] tracking-wider">REPORTS</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#555a62]">
            {events.length} events · click CSV or TXT to download
          </span>
          <button
            onClick={() => setShowBuilder((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold transition-colors"
            style={{
              background: showBuilder ? "#2a1a08" : "#1e2124",
              color:      "#f58220",
              border:     `1px solid ${showBuilder ? "#6a3a10" : "#4a3a20"}`,
            }}
          >
            {showBuilder ? "✕ Cancel" : "+ Create Report"}
          </button>
        </div>
      </div>

      {showBuilder && (
        <CustomReportBuilder
          events={events}
          onDownloaded={() => setShowBuilder(false)}
        />
      )}

      {lastDownload && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-mono"
          style={{ background: "#0e2a1a", border: "1px solid #264a38" }}
        >
          <span className="text-[#48c78e]">✓</span>
          <span className="text-[#48c78e] font-semibold">Downloaded:</span>
          <span className="text-[#c8d0d8]">
            {REPORTS.find((r) => r.id === lastDownload.id)?.title}
          </span>
          <span className="text-[#555a62]">({lastDownload.fmt.toUpperCase()})</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {REPORTS.map((rpt) => {
          const sev     = SEV_STYLE[rpt.severity];
          const isLast  = lastDownload?.id === rpt.id;
          return (
            <div
              key={rpt.id}
              className="rounded-sm px-3 py-2.5 flex items-center gap-4"
              style={{
                background: isLast ? "#0e1e14" : "#1a1c20",
                borderTop:    `1px solid ${isLast ? "#264a38" : "#2a2d32"}`,
                borderRight:  `1px solid ${isLast ? "#264a38" : "#2a2d32"}`,
                borderBottom: `1px solid ${isLast ? "#264a38" : "#2a2d32"}`,
                borderLeft:   `3px solid ${sev.color}`,
              }}
            >
              {/* Report info */}
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

              {/* Schedule / format info */}
              <div className="flex-shrink-0 text-right text-xs font-mono text-[#555a62] w-20">
                <div>{rpt.schedule}</div>
              </div>

              {/* Download buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleDownload(rpt.id, "csv")}
                  title={`Download ${rpt.title} as CSV`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-mono font-semibold transition-colors"
                  style={{
                    background: lastDownload?.id === rpt.id && lastDownload.fmt === "csv" ? "#0e2a1a" : "#1e2124",
                    color:      lastDownload?.id === rpt.id && lastDownload.fmt === "csv" ? "#48c78e" : "#48c78e",
                    border:     `1px solid ${lastDownload?.id === rpt.id && lastDownload.fmt === "csv" ? "#264a38" : "#1e4a30"}`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1a3020"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = lastDownload?.id === rpt.id && lastDownload.fmt === "csv" ? "#0e2a1a" : "#1e2124"; }}
                >
                  ↓ CSV
                </button>
                <button
                  onClick={() => handleDownload(rpt.id, "txt")}
                  title={`Download ${rpt.title} as TXT`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-mono font-semibold transition-colors"
                  style={{
                    background: lastDownload?.id === rpt.id && lastDownload.fmt === "txt" ? "#1a1e08" : "#1e2124",
                    color:      "#c9a227",
                    border:     `1px solid ${lastDownload?.id === rpt.id && lastDownload.fmt === "txt" ? "#4a4010" : "#3a3010"}`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#2a2210"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = lastDownload?.id === rpt.id && lastDownload.fmt === "txt" ? "#1a1e08" : "#1e2124"; }}
                >
                  ↓ TXT
                </button>
              </div>
            </div>
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

export function NavPanel({ activeTab, onClose, rawEvents, onOpenDashboard }: Props) {
  if (!activeTab) return null;

  return (
    <div
      className="border-b border-[#2d3035] flex-shrink-0 overflow-y-auto"
      style={{ background: "#14161a", maxHeight: "420px" }}
    >
      {activeTab === "search"         && <SearchPanel events={rawEvents} />}
      {activeTab === "dashboards"     && (
        <DashboardsPanel onOpenDashboard={(id) => { onOpenDashboard?.(id); onClose(); }} />
      )}
      {activeTab === "reports"        && <ReportsPanel events={rawEvents} />}
      {activeTab === "investigations" && <InvestigationsPanel />}
    </div>
  );
}
