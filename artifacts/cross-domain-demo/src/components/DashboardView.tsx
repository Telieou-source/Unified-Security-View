import type { RawEvent } from "../types";

/* ── colour helpers ── */
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
const DOMAIN_BG: Record<string, string> = {
  ALPHA:   "#0d1e2d",
  BRAVO:   "#0d2017",
  CHARLIE: "#2d2208",
};

/* ── stat aggregation helpers ── */
function countBy<T>(items: T[], key: (item: T) => string): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    map[k] = (map[k] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/* ── reusable mini-bar chart ── */
function BarChart({
  rows,
  colorMap,
  maxWidth = "100%",
}: {
  rows: { label: string; count: number }[];
  colorMap?: Record<string, string>;
  maxWidth?: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="flex flex-col gap-1.5" style={{ maxWidth }}>
      {rows.map(({ label, count }) => {
        const color = colorMap?.[label] ?? "#f58220";
        const pct = (count / max) * 100;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className="text-right font-mono flex-shrink-0 text-xs"
              style={{ color: colorMap?.[label] ?? "#8a9aaa", width: "88px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={label}
            >
              {label}
            </div>
            <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: "#1a1c20" }}>
              <div
                className="h-full rounded-sm transition-all"
                style={{ width: `${pct}%`, background: color, opacity: 0.85 }}
              />
            </div>
            <div className="text-xs font-mono font-semibold flex-shrink-0" style={{ color, width: "28px", textAlign: "right" }}>
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── stat card ── */
function StatCard({
  label,
  value,
  sub,
  color = "#f58220",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-sm px-4 py-3"
      style={{ background: "#1a1c20", border: "1px solid #2a2d32" }}
    >
      <div className="text-xs text-[#555a62] font-mono uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-[#444850] font-mono">{sub}</div>}
    </div>
  );
}

/* ── panel wrapper ── */
function Panel({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`rounded-sm p-4 flex flex-col gap-3 ${wide ? "col-span-2" : ""}`}
      style={{ background: "#14161a", border: "1px solid #2a2d32" }}
    >
      <div className="text-xs font-semibold tracking-wider text-[#888c94]">{title}</div>
      {children}
    </div>
  );
}

/* ── simple table ── */
function MiniTable({
  columns,
  rows,
  colorCols,
}: {
  columns: string[];
  rows: string[][];
  colorCols?: Record<number, Record<string, string>>;
}) {
  return (
    <div className="overflow-auto rounded-sm" style={{ border: "1px solid #222528" }}>
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr style={{ background: "#191c20", borderBottom: "1px solid #2a2d32" }}>
            {columns.map((c) => (
              <th key={c} className="px-3 py-1.5 text-left text-[#555a62] font-semibold whitespace-nowrap" style={{ letterSpacing: "0.04em" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "#14161a" : "#171a1e", borderBottom: "1px solid #1a1c20" }}>
              {row.map((cell, ci) => {
                const color = colorCols?.[ci]?.[cell];
                return (
                  <td
                    key={ci}
                    className="px-3 py-1.5 whitespace-nowrap"
                    style={{ color: color ?? "#8a9aaa", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
                    title={cell}
                  >
                    {color ? <span style={{ color }} className="font-semibold">{cell}</span> : cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── progress ring (mini donut) ── */
function DonutSlice({ pct, color }: { pct: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <circle
      cx="22" cy="22" r={r}
      fill="none"
      stroke={color}
      strokeWidth="6"
      strokeDasharray={`${dash} ${circ - dash}`}
      strokeLinecap="round"
      transform="rotate(-90 22 22)"
    />
  );
}

/* ══════════════════════════════════════════════════
   DASHBOARD DEFINITIONS
══════════════════════════════════════════════════ */

/* 1. Threat Overview */
function ThreatOverview({ events }: { events: RawEvent[] }) {
  const bySev   = countBy(events, (e) => e.severity);
  const byType  = countBy(events, (e) => e.type).slice(0, 7);
  const byDom   = countBy(events, (e) => e.domainId);
  const fatal   = events.filter((e) => e.severity === "FATAL").length;
  const exfil   = events.filter((e) => e.type === "ExfilAttempt").length;
  const privEsc = events.filter((e) => e.type === "PrivilegeEsc").length;
  const crossUsers = [...new Set(
    events.filter((e) =>
      [...new Set(events.filter((x) => x.userId === e.userId).map((x) => x.domainId))].length > 1
    ).map((e) => e.userId)
  )].length;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Events"    value={events.length}  color="#f58220" sub="All domains combined" />
        <StatCard label="FATAL Alerts"    value={fatal}           color="#e55555" sub="Immediate action required" />
        <StatCard label="Exfil Attempts"  value={exfil}           color="#f58220" sub="Data loss risk" />
        <StatCard label="Priv Escalations" value={privEsc}        color="#e5c97a" sub="Lateral movement risk" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-3">
        <Panel title="SEVERITY DISTRIBUTION">
          <BarChart rows={bySev} colorMap={SEV_COLOR} />
        </Panel>
        <Panel title="TOP EVENT TYPES">
          <BarChart rows={byType} />
        </Panel>
        <Panel title="EVENTS BY DOMAIN">
          <BarChart rows={byDom} colorMap={DOMAIN_COLOR} />
          <div className="mt-1 text-xs text-[#555a62] font-mono">
            {crossUsers} cross-domain user{crossUsers !== 1 ? "s" : ""} detected
          </div>
        </Panel>
      </div>

      {/* Recent FATAL events */}
      <Panel title="RECENT FATAL EVENTS" wide>
        <MiniTable
          columns={["TIME", "DOMAIN", "HOST", "TYPE", "USER", "CLASSIFICATION"]}
          rows={events
            .filter((e) => e.severity === "FATAL")
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 8)
            .map((e) => [
              new Date(e.timestamp).toISOString().replace("T", " ").slice(11, 19),
              e.domainId,
              e.host,
              e.type,
              e.userId ?? "—",
              e.classification,
            ])}
          colorCols={{ 1: DOMAIN_COLOR, 3: { ExfilAttempt: "#e55555", PrivilegeEsc: "#f58220" } }}
        />
      </Panel>
    </div>
  );
}

/* 2. Domain Activity Monitor */
function DomainActivity({ events }: { events: RawEvent[] }) {
  const domains = ["ALPHA", "BRAVO", "CHARLIE"] as const;
  const domainEvents = (d: string) => events.filter((e) => e.domainId === d);
  const recentWindow = Date.now() - 15 * 60_000;

  return (
    <div className="flex flex-col gap-4">
      {/* Per-domain stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {domains.map((d) => {
          const de = domainEvents(d);
          const recent = de.filter((e) => e.timestamp >= recentWindow).length;
          const fatal = de.filter((e) => e.severity === "FATAL").length;
          return (
            <div
              key={d}
              className="rounded-sm p-4 flex flex-col gap-2"
              style={{ background: DOMAIN_BG[d], border: `1px solid ${DOMAIN_COLOR[d]}30` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: DOMAIN_COLOR[d] }}>
                  DOMAIN {d}
                </span>
                <span
                  className="text-xs px-1.5 rounded-sm font-mono"
                  style={{ background: "#0e2a1a", color: "#48c78e", border: "1px solid #264a38" }}
                >
                  ONLINE
                </span>
              </div>
              <div className="text-3xl font-bold font-mono" style={{ color: DOMAIN_COLOR[d] }}>
                {de.length}
              </div>
              <div className="text-xs text-[#555a62] font-mono">total events</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <div className="text-xs text-[#444850] font-mono">last 15 min</div>
                  <div className="text-sm font-semibold font-mono" style={{ color: DOMAIN_COLOR[d] }}>{recent}</div>
                </div>
                <div>
                  <div className="text-xs text-[#444850] font-mono">FATAL</div>
                  <div className="text-sm font-semibold font-mono text-[#e55555]">{fatal}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-domain event type breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {domains.map((d) => {
          const de = domainEvents(d);
          const byType = countBy(de, (e) => e.type).slice(0, 6);
          return (
            <Panel key={d} title={`${d} — EVENT TYPES`}>
              <BarChart rows={byType} />
            </Panel>
          );
        })}
      </div>

      {/* Top hosts per domain */}
      <div className="grid grid-cols-3 gap-3">
        {domains.map((d) => {
          const de = domainEvents(d);
          const byHost = countBy(de, (e) => e.host).slice(0, 5);
          return (
            <Panel key={d} title={`${d} — TOP HOSTS`}>
              <BarChart rows={byHost} colorMap={Object.fromEntries(byHost.map((r) => [r.label, DOMAIN_COLOR[d]]))} />
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* 3. Network Connection Analysis */
function NetworkAnalysis({ events }: { events: RawEvent[] }) {
  const bySourceIp = countBy(events, (e) => e.srcIp).slice(0, 10);
  const byDestPort = countBy(events, (e) => String(e.dstPort)).slice(0, 8);
  const byProtocol = countBy(events, (e) => e.protocol);

  const EXTERNAL_RANGES = ["185.", "91.", "45.", "1.1.1.1", "8.8."];
  const externalEvents = events.filter((e) =>
    EXTERNAL_RANGES.some((r) => (e.dstIp ?? "").startsWith(r))
  );
  const externalIps = countBy(externalEvents, (e) => e.dstIp ?? "unknown").slice(0, 8);

  const PORT_LABELS: Record<string, string> = {
    "80":   "80/HTTP",
    "443":  "443/HTTPS",
    "445":  "445/SMB",
    "389":  "389/LDAP",
    "636":  "636/LDAPS",
    "53":   "53/DNS",
    "8080": "8080/HTTP-ALT",
    "8443": "8443/HTTPS-ALT",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Unique Src IPs"    value={[...new Set(events.map((e) => e.srcIp))].length}  color="#4ea6dc" />
        <StatCard label="Unique Dst IPs"    value={[...new Set(events.map((e) => e.dstIp))].length}   color="#48c78e" />
        <StatCard label="External Contacts" value={externalEvents.length}  color="#e55555" sub="Potential exfil" />
        <StatCard label="Unique Ports"      value={[...new Set(events.map((e) => e.dstPort))].length} color="#c9a227" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel title="TOP SOURCE IPs">
          <BarChart rows={bySourceIp} />
        </Panel>
        <Panel title="EXTERNAL DESTINATION IPs (SUSPICIOUS)">
          <BarChart
            rows={externalIps.length ? externalIps : [{ label: "No external contacts", count: 0 }]}
            colorMap={Object.fromEntries(externalIps.map((r) => [r.label, "#e55555"]))}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel title="DESTINATION PORT DISTRIBUTION">
          <BarChart
            rows={byDestPort.map((r) => ({ label: PORT_LABELS[r.label] ?? r.label, count: r.count }))}
            colorMap={{ "443/HTTPS": "#48c78e", "445/SMB": "#f58220", "53/DNS": "#4ea6dc", "8443/HTTPS-ALT": "#f58220" }}
          />
        </Panel>
        <Panel title="PROTOCOL BREAKDOWN">
          <BarChart
            rows={byProtocol}
            colorMap={{ TCP: "#4ea6dc", UDP: "#c9a227" }}
          />
          <MiniTable
            columns={["DOMAIN", "TCP", "UDP"]}
            rows={["ALPHA", "BRAVO", "CHARLIE"].map((d) => {
              const de = events.filter((e) => e.domainId === d);
              return [
                d,
                String(de.filter((e) => e.protocol === "TCP").length),
                String(de.filter((e) => e.protocol === "UDP").length),
              ];
            })}
            colorCols={{ 0: DOMAIN_COLOR }}
          />
        </Panel>
      </div>
    </div>
  );
}

/* 4. User Behavior Analytics */
function UserBehavior({ events }: { events: RawEvent[] }) {
  const allUsers = events.map((e) => e.userId ?? "unknown");
  const byUser  = countBy(events, (e) => e.userId ?? "unknown").slice(0, 10);

  /* cross-domain users */
  const userDomains: Record<string, Set<string>> = {};
  for (const e of events) {
    const u = e.userId ?? "unknown";
    if (!userDomains[u]) userDomains[u] = new Set();
    userDomains[u].add(e.domainId);
  }
  const crossUsers = Object.entries(userDomains)
    .filter(([, ds]) => ds.size > 1)
    .sort((a, b) => b[1].size - a[1].size);

  /* privilege escalations by user */
  const privEscByUser = countBy(
    events.filter((e) => e.type === "PrivilegeEsc"),
    (e) => e.userId ?? "unknown"
  ).slice(0, 6);

  /* exfil by user */
  const exfilByUser = countBy(
    events.filter((e) => e.type === "ExfilAttempt"),
    (e) => e.userId ?? "unknown"
  ).slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Unique Users"     value={[...new Set(allUsers)].length} color="#f58220" />
        <StatCard label="Cross-Domain"     value={crossUsers.length}              color="#e55555" sub="Multi-domain activity" />
        <StatCard label="Priv Esc Users"   value={privEscByUser.length}           color="#f58220" sub="Escalation events" />
        <StatCard label="Exfil Actors"     value={exfilByUser.length}             color="#e55555" sub="Data exfil involved" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel title="TOP USERS BY EVENT COUNT">
          <BarChart rows={byUser} />
        </Panel>

        <Panel title="CROSS-DOMAIN USERS (HIGH RISK)">
          <MiniTable
            columns={["USER", "DOMAINS", "DC"]}
            rows={crossUsers.map(([user, ds]) => [
              user,
              [...ds].join(", "),
              String(ds.size),
            ])}
            colorCols={{ 2: { "3": "#e55555", "2": "#f58220" } }}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel title="PRIVILEGE ESCALATIONS BY USER">
          <BarChart rows={privEscByUser} colorMap={Object.fromEntries(privEscByUser.map((r) => [r.label, "#f58220"]))} />
        </Panel>
        <Panel title="EXFIL ATTEMPTS BY USER">
          <BarChart rows={exfilByUser} colorMap={Object.fromEntries(exfilByUser.map((r) => [r.label, "#e55555"]))} />
        </Panel>
      </div>
    </div>
  );
}

/* 5. Incident Timeline */
function IncidentTimeline({ events }: { events: RawEvent[] }) {
  const notable = events
    .filter((e) => e.severity === "FATAL" || e.severity === "ERROR")
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 30);

  const TYPE_ICON: Record<string, string> = {
    ExfilAttempt:    "⚠",
    PrivilegeEsc:    "↑",
    Authentication:  "🔒",
    AnomalyDetected: "◈",
    PolicyViolation: "✕",
    FileAccess:      "📄",
    NetworkConn:     "⇄",
    ProcessSpawn:    "⚙",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Notable Events"  value={notable.length}      color="#e55555" sub="FATAL + ERROR severity" />
        <StatCard label="FATAL"           value={events.filter((e) => e.severity === "FATAL").length} color="#e55555" />
        <StatCard label="ERROR"           value={events.filter((e) => e.severity === "ERROR").length} color="#f58220" />
        <StatCard label="Affected Domains" value={[...new Set(notable.map((e) => e.domainId))].length} color="#c9a227" />
      </div>

      <Panel title="INCIDENT TIMELINE — NOTABLE EVENTS (FATAL / ERROR)" wide>
        <div className="flex flex-col gap-0 overflow-auto" style={{ maxHeight: "400px" }}>
          {notable.map((e, i) => (
            <div
              key={e.id}
              className="flex items-start gap-3 px-3 py-2 border-b"
              style={{
                borderBottomColor: "#1e2124",
                background: i % 2 === 0 ? "#14161a" : "#16181c",
              }}
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ marginTop: "2px" }}>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: SEV_COLOR[e.severity] }}
                />
              </div>

              {/* Time */}
              <div className="text-xs font-mono flex-shrink-0 text-[#555a62] w-20">
                {new Date(e.timestamp).toISOString().slice(11, 19)}
              </div>

              {/* Domain badge */}
              <div
                className="text-xs font-mono font-semibold flex-shrink-0 px-1.5 rounded-sm"
                style={{ color: DOMAIN_COLOR[e.domainId], background: DOMAIN_BG[e.domainId], minWidth: "58px", textAlign: "center" }}
              >
                {e.domainId}
              </div>

              {/* Severity badge */}
              <div
                className="text-xs font-mono font-semibold flex-shrink-0 px-1.5 rounded-sm"
                style={{ color: SEV_COLOR[e.severity], background: "#1a1a1a", minWidth: "40px", textAlign: "center" }}
              >
                {e.severity}
              </div>

              {/* Event type + icon */}
              <div className="text-xs font-mono flex-shrink-0 w-32 text-[#8a9aaa]">
                {TYPE_ICON[e.type] ?? "•"} {e.type}
              </div>

              {/* Host + user */}
              <div className="text-xs font-mono text-[#666b74] flex-1 min-w-0 truncate">
                {e.host} &nbsp;·&nbsp; {e.userId ?? "—"} &nbsp;·&nbsp; {e.srcIp} → {e.dstIp}:{e.dstPort}
              </div>

              {/* Classification */}
              <div className="text-xs font-mono flex-shrink-0 text-[#444850]">
                {e.classification}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* 6. Executive Summary */
function ExecSummary({ events }: { events: RawEvent[] }) {
  const fatal   = events.filter((e) => e.severity === "FATAL").length;
  const error   = events.filter((e) => e.severity === "ERROR").length;
  const warn    = events.filter((e) => e.severity === "WARN").length;
  const info    = events.filter((e) => e.severity === "INFO").length;
  const exfil   = events.filter((e) => e.type === "ExfilAttempt").length;
  const priv    = events.filter((e) => e.type === "PrivilegeEsc").length;
  const domains = [...new Set(events.map((e) => e.domainId))].length;

  /* cross-domain users */
  const userDomains: Record<string, Set<string>> = {};
  for (const e of events) {
    const u = e.userId ?? "unknown";
    if (!userDomains[u]) userDomains[u] = new Set();
    userDomains[u].add(e.domainId);
  }
  const crossUsers = Object.values(userDomains).filter((ds) => ds.size > 1).length;

  const totalThreats = fatal + error;
  const riskColor = fatal > 5 ? "#e55555" : fatal > 0 ? "#f58220" : "#48c78e";
  const riskLabel = fatal > 5 ? "CRITICAL" : fatal > 0 ? "HIGH" : error > 10 ? "ELEVATED" : "MODERATE";

  const sevRows = [
    ["FATAL", fatal, "#e55555"],
    ["ERROR", error, "#f58220"],
    ["WARN",  warn,  "#e5c97a"],
    ["INFO",  info,  "#8eb8d4"],
  ] as [string, number, string][];

  return (
    <div className="flex flex-col gap-4">
      {/* Risk posture banner */}
      <div
        className="rounded-sm px-5 py-4 flex items-center justify-between"
        style={{ background: "#1a1c20", border: `1px solid ${riskColor}40` }}
      >
        <div>
          <div className="text-xs text-[#555a62] font-mono uppercase tracking-wider mb-1">Current Risk Posture</div>
          <div className="text-3xl font-bold font-mono" style={{ color: riskColor }}>{riskLabel}</div>
          <div className="text-xs text-[#555a62] font-mono mt-1">{domains} domains monitored · {totalThreats} notable events</div>
        </div>
        <div className="relative">
          <svg width="88" height="88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#2a2d32" strokeWidth="8" />
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              stroke={riskColor}
              strokeWidth="8"
              strokeDasharray={`${Math.min((totalThreats / Math.max(events.length, 1)) * 100 * 2.26, 226)} 226`}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
              style={{ opacity: 0.8 }}
            />
            <text x="44" y="48" textAnchor="middle" fontSize="13" fontWeight="bold" fill={riskColor} fontFamily="monospace">
              {Math.round((totalThreats / Math.max(events.length, 1)) * 100)}%
            </text>
          </svg>
          <div className="text-xs text-[#555a62] font-mono text-center -mt-1">threat rate</div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-6 gap-2">
        <StatCard label="Total Events"    value={events.length}   color="#8eb8d4" />
        <StatCard label="FATAL"           value={fatal}            color="#e55555" />
        <StatCard label="Exfil Attempts"  value={exfil}            color="#e55555" />
        <StatCard label="Priv Escalations" value={priv}            color="#f58220" />
        <StatCard label="Cross-Domain"    value={crossUsers}        color="#c9a227" sub="Suspicious users" />
        <StatCard label="Domains"         value={domains}           color="#48c78e" sub="Under monitoring" />
      </div>

      {/* Split: severity table + domain breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <Panel title="SEVERITY BREAKDOWN">
          <div className="flex flex-col gap-2">
            {sevRows.map(([sev, count, color]) => (
              <div key={sev} className="flex items-center justify-between py-1.5 border-b border-[#1e2124]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                  <span className="text-xs font-mono font-semibold" style={{ color }}>{sev}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-sm overflow-hidden" style={{ background: "#1e2124" }}>
                    <div style={{ width: `${(count / events.length) * 100}%`, height: "100%", background: color, opacity: 0.8 }} />
                  </div>
                  <span className="text-xs font-mono text-[#8a9aaa] w-8 text-right">{count}</span>
                  <span className="text-xs font-mono text-[#444850] w-8 text-right">
                    {events.length ? Math.round((count / events.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="DOMAIN HEALTH">
          <div className="flex flex-col gap-3">
            {["ALPHA", "BRAVO", "CHARLIE"].map((d) => {
              const de = events.filter((e) => e.domainId === d);
              const df = de.filter((e) => e.severity === "FATAL").length;
              const de2 = de.filter((e) => e.severity === "ERROR").length;
              return (
                <div key={d} className="flex items-center gap-3 py-1.5 border-b border-[#1e2124]">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: DOMAIN_COLOR[d] }} />
                  <span className="text-xs font-mono font-semibold flex-shrink-0 w-16" style={{ color: DOMAIN_COLOR[d] }}>{d}</span>
                  <div className="flex-1 h-2 rounded-sm overflow-hidden" style={{ background: "#1e2124" }}>
                    <div style={{ width: `${(de.length / Math.max(events.length, 1)) * 100}%`, height: "100%", background: DOMAIN_COLOR[d], opacity: 0.7 }} />
                  </div>
                  <span className="text-xs font-mono text-[#8a9aaa] w-8 text-right">{de.length}</span>
                  <span className="text-xs font-mono text-[#e55555] w-12 text-right">{df} FATAL</span>
                  <span className="text-xs font-mono text-[#f58220] w-12 text-right">{de2} ERROR</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Recommendations */}
      <Panel title="ANALYST RECOMMENDATIONS">
        <div className="grid grid-cols-2 gap-2">
          {[
            { color: "#e55555", text: `Investigate ${crossUsers} cross-domain user account(s) — potential lateral movement` },
            { color: "#e55555", text: `Review ${exfil} ExfilAttempt event(s) — validate data loss controls` },
            { color: "#f58220", text: `Audit ${priv} PrivilegeEsc event(s) — confirm authorization for each escalation` },
            { color: "#e5c97a", text: `Run cross-domain correlation query to identify shared threat actor indicators` },
          ].map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 rounded-sm text-xs font-mono"
              style={{ background: "#1a1c20", border: `1px solid ${rec.color}30`, borderLeft: `3px solid ${rec.color}` }}
            >
              <span style={{ color: rec.color }}>▶</span>
              <span className="text-[#8a9aaa]">{rec.text}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════ */

const DASHBOARD_DEFS: Record<string, { title: string; subtitle: string }> = {
  "threat-overview":   { title: "Threat Overview",               subtitle: "Real-time severity distribution and critical alert summary" },
  "domain-activity":   { title: "Domain Activity Monitor",       subtitle: "Per-domain event volume, ingest rates, and top hosts" },
  "network-analysis":  { title: "Network Connection Analysis",    subtitle: "Source IPs, destination ports, protocol breakdown, and exfil signals" },
  "user-behavior":     { title: "User Behavior Analytics",        subtitle: "Cross-domain users, privilege escalation tracking, and exfil actors" },
  "incident-timeline": { title: "Incident Timeline",              subtitle: "Chronological notable events — FATAL and ERROR severity" },
  "exec-summary":      { title: "Executive Summary",              subtitle: "Risk posture, KPIs, domain health, and analyst recommendations" },
};

interface Props {
  dashboardId: string | null;
  events: RawEvent[];
  onClose: () => void;
}

export function DashboardView({ dashboardId, events, onClose }: Props) {
  if (!dashboardId) return null;

  const def = DASHBOARD_DEFS[dashboardId];
  if (!def) return null;

  const renderContent = () => {
    switch (dashboardId) {
      case "threat-overview":   return <ThreatOverview   events={events} />;
      case "domain-activity":   return <DomainActivity   events={events} />;
      case "network-analysis":  return <NetworkAnalysis  events={events} />;
      case "user-behavior":     return <UserBehavior     events={events} />;
      case "incident-timeline": return <IncidentTimeline events={events} />;
      case "exec-summary":      return <ExecSummary      events={events} />;
      default: return <div className="text-[#555a62] font-mono text-xs p-4">Dashboard not found.</div>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden"
      style={{ background: "#111315" }}
    >
      {/* Dashboard header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-[#2a2d32] flex-shrink-0"
        style={{ background: "#1a1c1f" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-mono text-[#555a62] hover:text-[#8a9aaa] transition-colors"
          >
            ← Back
          </button>
          <div className="w-px h-5 bg-[#2a2d32]" />
          <div>
            <div className="text-sm font-semibold text-[#c8d0d8]">{def.title}</div>
            <div className="text-xs font-mono text-[#555a62]">{def.subtitle}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#48c78e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#48c78e] animate-pulse" />
            Live · {events.length} events
          </div>
          <div className="text-xs font-mono text-[#555a62]">index=cross_domain_siem</div>
          <span className="text-xs font-mono text-[#e55555] font-semibold">TOP SECRET // HIGH SIDE</span>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="flex-1 overflow-auto px-5 py-4">
        {renderContent()}
      </div>
    </div>
  );
}
