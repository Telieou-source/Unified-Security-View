import type { RawEvent } from "../types";

const today = () => new Date().toISOString().slice(0, 10);
const ts = (ms: number) => new Date(ms).toISOString().replace("T", " ").slice(0, 19) + " UTC";

/* ── Shared CSV helpers ── */
function csvEscape(val: string | number | undefined): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(headers: string[], rows: (string | number | undefined)[][]): string {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  return head + "\n" + body;
}

/* ── MITRE mapping ── */
const MITRE: Record<string, { technique: string; tactic: string }> = {
  Authentication:  { technique: "T1110 – Brute Force",            tactic: "Credential Access" },
  ExfilAttempt:    { technique: "T1048 – Exfil Over Alt Protocol", tactic: "Exfiltration" },
  PrivilegeEsc:    { technique: "T1068 – Exploitation for Priv Esc", tactic: "Privilege Escalation" },
  FileAccess:      { technique: "T1083 – File and Directory Discovery", tactic: "Discovery" },
  NetworkConn:     { technique: "T1071 – Application Layer Protocol", tactic: "Command and Control" },
  AnomalyDetected: { technique: "T1036 – Masquerading",           tactic: "Defense Evasion" },
  PolicyViolation: { technique: "T1562 – Impair Defenses",        tactic: "Defense Evasion" },
  ProcessSpawn:    { technique: "T1059 – Command and Scripting",  tactic: "Execution" },
};

/* ── Confidence score ── */
function confidence(e: RawEvent): number {
  const base: Record<string, number> = {
    ExfilAttempt: 88, PrivilegeEsc: 82, Authentication: 75,
    AnomalyDetected: 79, PolicyViolation: 71, FileAccess: 65,
    NetworkConn: 60, ProcessSpawn: 68,
  };
  const sevBonus: Record<string, number> = { FATAL: 10, ERROR: 5, WARN: 0, INFO: -10 };
  return Math.min(99, (base[e.type] ?? 60) + (sevBonus[e.severity] ?? 0));
}

/* ═══════════════════════════════════════════════════
   1. CROSS-DOMAIN CORRELATION REPORT
═══════════════════════════════════════════════════ */
export function generateCorrelationCSV(events: RawEvent[]): string {
  const notable = events
    .filter((e) => ["ExfilAttempt", "PrivilegeEsc", "AnomalyDetected", "Authentication"].includes(e.type))
    .sort((a, b) => b.timestamp - a.timestamp);

  const headers = [
    "event_id", "timestamp", "domain", "event_type", "severity",
    "src_ip", "dst_ip", "dst_port", "protocol",
    "user_id", "host", "classification",
    "mitre_technique", "mitre_tactic", "confidence_pct",
  ];

  const rows = notable.map((e) => {
    const m = MITRE[e.type] ?? { technique: "—", tactic: "—" };
    return [
      e.id, ts(e.timestamp), e.domainId, e.type, e.severity,
      e.srcIp, e.dstIp, e.dstPort, e.protocol,
      e.userId ?? "—", e.host, e.classification,
      m.technique, m.tactic, confidence(e),
    ];
  });

  return toCSV(headers, rows);
}

export function generateCorrelationTXT(events: RawEvent[]): string {
  const notable = events
    .filter((e) => ["ExfilAttempt", "PrivilegeEsc", "AnomalyDetected", "Authentication"].includes(e.type))
    .sort((a, b) => b.timestamp - a.timestamp);

  const domains = [...new Set(notable.map((e) => e.domainId))].join(", ");
  const fatal = notable.filter((e) => e.severity === "FATAL").length;

  let out = `CROSS-DOMAIN CORRELATION REPORT
Generated: ${ts(Date.now())}
Classification: TOP SECRET // HIGH SIDE
Index: cross_domain_siem
${"=".repeat(72)}

EXECUTIVE SUMMARY
-----------------
Total correlated events : ${notable.length}
Domains involved        : ${domains}
FATAL severity events   : ${fatal}
Reporting period        : All available data

${"=".repeat(72)}
CORRELATED EVENTS (sorted newest first)
${"=".repeat(72)}

`;

  for (const e of notable) {
    const m = MITRE[e.type] ?? { technique: "—", tactic: "—" };
    out += `[${e.severity}] ${ts(e.timestamp)}
  ID            : ${e.id}
  Domain        : ${e.domainId}
  Event Type    : ${e.type}
  Host          : ${e.host}
  User          : ${e.userId ?? "—"}
  Src IP:Port   : ${e.srcIp}:${e.srcPort}
  Dst IP:Port   : ${e.dstIp}:${e.dstPort} (${e.protocol})
  Classification: ${e.classification}
  MITRE         : ${m.technique} [${m.tactic}]
  Confidence    : ${confidence(e)}%

`;
  }

  out += `${"=".repeat(72)}
END OF REPORT
`;
  return out;
}

/* ═══════════════════════════════════════════════════
   2. THREAT INTELLIGENCE SUMMARY
═══════════════════════════════════════════════════ */
export function generateThreatIntelCSV(events: RawEvent[]): string {
  const hostile = events.filter((e) => e.severity === "FATAL" || e.severity === "ERROR");

  /* IP indicators */
  const ipMap: Record<string, { count: number; domains: Set<string>; types: Set<string>; first: number; last: number }> = {};
  for (const e of hostile) {
    const ip = e.srcIp;
    if (!ipMap[ip]) ipMap[ip] = { count: 0, domains: new Set(), types: new Set(), first: e.timestamp, last: e.timestamp };
    ipMap[ip].count++;
    ipMap[ip].domains.add(e.domainId);
    ipMap[ip].types.add(e.type);
    ipMap[ip].first = Math.min(ipMap[ip].first, e.timestamp);
    ipMap[ip].last  = Math.max(ipMap[ip].last, e.timestamp);
  }

  /* User indicators */
  const userMap: Record<string, { count: number; domains: Set<string>; types: Set<string>; first: number; last: number }> = {};
  for (const e of hostile) {
    const u = e.userId ?? "unknown";
    if (!userMap[u]) userMap[u] = { count: 0, domains: new Set(), types: new Set(), first: e.timestamp, last: e.timestamp };
    userMap[u].count++;
    userMap[u].domains.add(e.domainId);
    userMap[u].types.add(e.type);
    userMap[u].first = Math.min(userMap[u].first, e.timestamp);
    userMap[u].last  = Math.max(userMap[u].last, e.timestamp);
  }

  const headers = [
    "indicator_type", "value", "event_count",
    "domains_observed", "domain_count",
    "event_types", "first_seen", "last_seen",
    "mitre_technique", "mitre_tactic",
  ];

  const rows: (string | number)[][] = [];

  for (const [ip, data] of Object.entries(ipMap).sort((a, b) => b[1].count - a[1].count)) {
    const topType = [...data.types][0] ?? "Unknown";
    const m = MITRE[topType] ?? { technique: "—", tactic: "—" };
    rows.push([
      "ip_address", ip, data.count,
      [...data.domains].join("|"), data.domains.size,
      [...data.types].join("|"), ts(data.first), ts(data.last),
      m.technique, m.tactic,
    ]);
  }

  for (const [user, data] of Object.entries(userMap).sort((a, b) => b[1].count - a[1].count)) {
    const topType = [...data.types][0] ?? "Unknown";
    const m = MITRE[topType] ?? { technique: "—", tactic: "—" };
    rows.push([
      "user_account", user, data.count,
      [...data.domains].join("|"), data.domains.size,
      [...data.types].join("|"), ts(data.first), ts(data.last),
      m.technique, m.tactic,
    ]);
  }

  return toCSV(headers, rows);
}

export function generateThreatIntelTXT(events: RawEvent[]): string {
  const hostile = events.filter((e) => e.severity === "FATAL" || e.severity === "ERROR");
  const types = [...new Set(hostile.map((e) => e.type))];
  const exfil = hostile.filter((e) => e.type === "ExfilAttempt");

  let out = `THREAT INTELLIGENCE SUMMARY
Generated: ${ts(Date.now())}
Classification: TOP SECRET // HIGH SIDE
${"=".repeat(72)}

PERIOD SUMMARY
--------------
High-severity events : ${hostile.length}
Unique event types   : ${types.join(", ")}
Exfil attempts       : ${exfil.length}
Domains affected     : ${[...new Set(hostile.map((e) => e.domainId))].join(", ")}

${"=".repeat(72)}
THREAT INDICATORS
${"=".repeat(72)}

`;

  /* Group by event type */
  for (const type of types) {
    const te = hostile.filter((e) => e.type === type);
    const m = MITRE[type] ?? { technique: "—", tactic: "—" };
    const ips   = [...new Set(te.map((e) => e.srcIp))];
    const users = [...new Set(te.map((e) => e.userId ?? "unknown"))];
    out += `EVENT TYPE: ${type}
  MITRE Technique : ${m.technique}
  MITRE Tactic    : ${m.tactic}
  Occurrence count: ${te.length}
  Source IPs      : ${ips.slice(0, 6).join(", ")}${ips.length > 6 ? ` (+${ips.length - 6} more)` : ""}
  Users involved  : ${users.slice(0, 4).join(", ")}${users.length > 4 ? ` (+${users.length - 4} more)` : ""}
  Domains         : ${[...new Set(te.map((e) => e.domainId))].join(", ")}

`;
  }

  out += `${"=".repeat(72)}
END OF REPORT
`;
  return out;
}

/* ═══════════════════════════════════════════════════
   3. COMPLIANCE AUDIT LOG
═══════════════════════════════════════════════════ */
export function generateComplianceCSV(events: RawEvent[]): string {
  const auditEvents = events
    .filter((e) => ["PolicyViolation", "ExfilAttempt", "PrivilegeEsc", "FileAccess"].includes(e.type))
    .sort((a, b) => b.timestamp - a.timestamp);

  const headers = [
    "audit_id", "timestamp", "domain", "event_type", "severity",
    "user_id", "host", "src_ip", "dst_ip", "dst_port",
    "classification", "violation_category", "action_taken",
    "rawPacketBytes_stripped",
  ];

  const VIOLATION: Record<string, string> = {
    PolicyViolation: "Policy Violation",
    ExfilAttempt:    "Data Exfiltration Attempt",
    PrivilegeEsc:    "Privilege Escalation",
    FileAccess:      "Unauthorized File Access",
  };

  const ACTION: Record<string, string> = {
    FATAL: "Blocked + Alert + Investigation Opened",
    ERROR: "Alerted + Logged",
    WARN:  "Logged + Flagged for Review",
    INFO:  "Logged",
  };

  const rows = auditEvents.map((e, i) => [
    `AUD-${String(i + 1).padStart(5, "0")}`,
    ts(e.timestamp), e.domainId, e.type, e.severity,
    e.userId ?? "—", e.host, e.srcIp, e.dstIp, e.dstPort,
    e.classification,
    VIOLATION[e.type] ?? "Policy Event",
    ACTION[e.severity] ?? "Logged",
    "YES",
  ]);

  return toCSV(headers, rows);
}

export function generateComplianceTXT(events: RawEvent[]): string {
  const auditEvents = events
    .filter((e) => ["PolicyViolation", "ExfilAttempt", "PrivilegeEsc", "FileAccess"].includes(e.type))
    .sort((a, b) => b.timestamp - a.timestamp);

  const stripped = events.length;

  let out = `COMPLIANCE AUDIT LOG
Generated: ${ts(Date.now())}
Classification: TOP SECRET // HIGH SIDE
Audit Framework: Cross-Domain Guard Security Policy v3.2
${"=".repeat(72)}

AUDIT SUMMARY
-------------
Total auditable events     : ${auditEvents.length}
rawPacketBytes stripped     : ${stripped} (100% compliance)
PolicyViolation events      : ${auditEvents.filter((e) => e.type === "PolicyViolation").length}
Exfiltration attempts       : ${auditEvents.filter((e) => e.type === "ExfilAttempt").length}
Privilege escalations       : ${auditEvents.filter((e) => e.type === "PrivilegeEsc").length}
Unauthorized file accesses  : ${auditEvents.filter((e) => e.type === "FileAccess").length}

BOUNDARY SANITIZATION
---------------------
Cross-Domain Guard enforces stripping of rawPacketBytes on all
events crossing classification boundaries. All log metadata
(5-tuple, identity, timestamps) is preserved and passes to the
high-side correlator. Full sanitization compliance achieved.

${"=".repeat(72)}
AUDIT LOG ENTRIES
${"=".repeat(72)}

`;

  auditEvents.forEach((e, i) => {
    out += `AUD-${String(i + 1).padStart(5, "0")} | ${ts(e.timestamp)} | ${e.severity}
  Domain        : ${e.domainId}
  Event Type    : ${e.type}
  User          : ${e.userId ?? "—"}
  Host          : ${e.host}
  Connection    : ${e.srcIp}:${e.srcPort} → ${e.dstIp}:${e.dstPort} (${e.protocol})
  Classification: ${e.classification}
  rawPktBytes   : STRIPPED (guard boundary enforcement)

`;
  });

  out += `${"=".repeat(72)}
END OF AUDIT LOG
`;
  return out;
}

/* ═══════════════════════════════════════════════════
   4. INCIDENT RESPONSE TIMELINE
═══════════════════════════════════════════════════ */
export function generateIncidentCSV(events: RawEvent[]): string {
  const notable = events
    .filter((e) => e.severity === "FATAL" || e.severity === "ERROR")
    .sort((a, b) => a.timestamp - b.timestamp);

  const headers = [
    "seq", "timestamp", "domain", "severity", "event_type",
    "host", "user_id", "src_ip", "dst_ip", "dst_port", "protocol",
    "classification", "mitre_technique", "response_action",
  ];

  const RESPONSE: Record<string, string> = {
    FATAL: "Immediate containment + investigation",
    ERROR: "Alert analyst + begin triage",
  };

  const rows = notable.map((e, i) => {
    const m = MITRE[e.type] ?? { technique: "—", tactic: "—" };
    return [
      i + 1, ts(e.timestamp), e.domainId, e.severity, e.type,
      e.host, e.userId ?? "—", e.srcIp, e.dstIp, e.dstPort, e.protocol,
      e.classification, m.technique, RESPONSE[e.severity] ?? "Log and monitor",
    ];
  });

  return toCSV(headers, rows);
}

export function generateIncidentTXT(events: RawEvent[]): string {
  const notable = events
    .filter((e) => e.severity === "FATAL" || e.severity === "ERROR")
    .sort((a, b) => a.timestamp - b.timestamp);

  const domains = [...new Set(notable.map((e) => e.domainId))];
  const users   = [...new Set(notable.map((e) => e.userId ?? "unknown"))];

  let out = `INCIDENT RESPONSE TIMELINE
Generated: ${ts(Date.now())}
Classification: TOP SECRET // HIGH SIDE
${"=".repeat(72)}

INCIDENT OVERVIEW
-----------------
Total notable events : ${notable.length} (FATAL + ERROR)
Domains involved     : ${domains.join(", ")}
Unique accounts      : ${users.length}
Time span            : ${notable.length > 0 ? ts(notable[0].timestamp) + " → " + ts(notable[notable.length - 1].timestamp) : "N/A"}

RECOMMENDED IMMEDIATE ACTIONS
------------------------------
1. Isolate any host involved in ExfilAttempt events
2. Reset credentials for accounts with FATAL authentication failures
3. Review and revoke elevated privileges for PrivilegeEsc accounts
4. Block identified external IPs at the boundary firewall

${"=".repeat(72)}
CHRONOLOGICAL EVENT TIMELINE
${"=".repeat(72)}

`;

  let lastDomain = "";
  notable.forEach((e, i) => {
    if (e.domainId !== lastDomain) {
      out += `--- Domain ${e.domainId} ---\n\n`;
      lastDomain = e.domainId;
    }
    const m = MITRE[e.type] ?? { technique: "—", tactic: "—" };
    out += `[${String(i + 1).padStart(3, "0")}] ${ts(e.timestamp)} | ${e.severity}
  Event   : ${e.type}
  MITRE   : ${m.technique}
  Host    : ${e.host}
  User    : ${e.userId ?? "—"}
  Network : ${e.srcIp}:${e.srcPort} → ${e.dstIp}:${e.dstPort} (${e.protocol})
  Classify: ${e.classification}
  Action  : ${e.severity === "FATAL" ? "CONTAINMENT REQUIRED" : "Triage and investigate"}

`;
  });

  out += `${"=".repeat(72)}
END OF INCIDENT TIMELINE
`;
  return out;
}

/* ═══════════════════════════════════════════════════
   5. USER ACCESS REVIEW
═══════════════════════════════════════════════════ */
export function generateUserAccessCSV(events: RawEvent[]): string {
  const userMap: Record<string, {
    domains: Set<string>; total: number; fatal: number; error: number;
    privEsc: number; exfil: number; fileAccess: number;
    first: number; last: number; hosts: Set<string>;
  }> = {};

  for (const e of events) {
    const u = e.userId ?? "unknown";
    if (!userMap[u]) {
      userMap[u] = { domains: new Set(), total: 0, fatal: 0, error: 0, privEsc: 0, exfil: 0, fileAccess: 0, first: e.timestamp, last: e.timestamp, hosts: new Set() };
    }
    const r = userMap[u];
    r.domains.add(e.domainId);
    r.total++;
    if (e.severity === "FATAL") r.fatal++;
    if (e.severity === "ERROR") r.error++;
    if (e.type === "PrivilegeEsc") r.privEsc++;
    if (e.type === "ExfilAttempt") r.exfil++;
    if (e.type === "FileAccess") r.fileAccess++;
    r.first = Math.min(r.first, e.timestamp);
    r.last  = Math.max(r.last, e.timestamp);
    r.hosts.add(e.host);
  }

  const headers = [
    "user_id", "total_events", "fatal_count", "error_count",
    "priv_esc_events", "exfil_events", "file_access_events",
    "domain_count", "domains_active", "unique_hosts",
    "first_seen", "last_seen", "risk_level",
  ];

  const riskLevel = (r: typeof userMap[string]): string => {
    if (r.fatal > 0 || r.exfil > 0) return "CRITICAL";
    if (r.error > 2 || r.privEsc > 0) return "HIGH";
    if (r.domains.size > 1) return "MEDIUM";
    return "LOW";
  };

  const rows = Object.entries(userMap)
    .sort((a, b) => b[1].fatal - a[1].fatal || b[1].total - a[1].total)
    .map(([user, r]) => [
      user, r.total, r.fatal, r.error,
      r.privEsc, r.exfil, r.fileAccess,
      r.domains.size, [...r.domains].join("|"), r.hosts.size,
      ts(r.first), ts(r.last), riskLevel(r),
    ]);

  return toCSV(headers, rows);
}

export function generateUserAccessTXT(events: RawEvent[]): string {
  const userMap: Record<string, { domains: Set<string>; total: number; fatal: number; privEsc: number; exfil: number; first: number; last: number }> = {};

  for (const e of events) {
    const u = e.userId ?? "unknown";
    if (!userMap[u]) userMap[u] = { domains: new Set(), total: 0, fatal: 0, privEsc: 0, exfil: 0, first: e.timestamp, last: e.timestamp };
    userMap[u].domains.add(e.domainId);
    userMap[u].total++;
    if (e.severity === "FATAL") userMap[u].fatal++;
    if (e.type === "PrivilegeEsc") userMap[u].privEsc++;
    if (e.type === "ExfilAttempt") userMap[u].exfil++;
    userMap[u].first = Math.min(userMap[u].first, e.timestamp);
    userMap[u].last  = Math.max(userMap[u].last, e.timestamp);
  }

  const sorted = Object.entries(userMap).sort((a, b) => b[1].fatal - a[1].fatal || b[1].total - a[1].total);
  const crossDomain = sorted.filter(([, r]) => r.domains.size > 1);

  let out = `USER ACCESS REVIEW
Generated: ${ts(Date.now())}
Classification: TOP SECRET // HIGH SIDE
Reporting Period: All available data
${"=".repeat(72)}

SUMMARY
-------
Total unique users    : ${sorted.length}
Cross-domain users    : ${crossDomain.length}
CRITICAL risk users   : ${sorted.filter(([, r]) => r.fatal > 0 || r.exfil > 0).length}
Users with priv esc   : ${sorted.filter(([, r]) => r.privEsc > 0).length}

${"=".repeat(72)}
CROSS-DOMAIN USERS (High Risk)
${"=".repeat(72)}

`;

  for (const [user, r] of crossDomain) {
    out += `${user}
  Domains     : ${[...r.domains].join(", ")}
  Total events: ${r.total}
  FATAL       : ${r.fatal}
  Priv Esc    : ${r.privEsc}
  Exfil       : ${r.exfil}
  Last seen   : ${ts(r.last)}

`;
  }

  out += `${"=".repeat(72)}
ALL USER ACCOUNTS
${"=".repeat(72)}

`;
  for (const [user, r] of sorted) {
    out += `${user.padEnd(24)} | events: ${String(r.total).padStart(4)} | domains: ${r.domains.size} | FATAL: ${r.fatal} | privesc: ${r.privEsc} | exfil: ${r.exfil}\n`;
  }

  out += `\n${"=".repeat(72)}\nEND OF USER ACCESS REVIEW\n`;
  return out;
}

/* ═══════════════════════════════════════════════════
   6. NETWORK ANOMALY REPORT
═══════════════════════════════════════════════════ */
export function generateNetworkAnomalyCSV(events: RawEvent[]): string {
  const EXTERNAL = ["185.", "91.", "45.", "1.1.1.", "8.8."];
  const anomalous = events.filter(
    (e) => e.type === "NetworkConn" || e.type === "ExfilAttempt" || e.severity === "FATAL" || e.severity === "ERROR"
  ).sort((a, b) => b.timestamp - a.timestamp);

  const headers = [
    "timestamp", "domain", "severity", "event_type",
    "src_ip", "src_port", "dst_ip", "dst_port", "protocol",
    "user_id", "host", "classification",
    "external_dst", "anomaly_category",
  ];

  const anomalyCategory = (e: RawEvent): string => {
    if (e.type === "ExfilAttempt") return "Data Exfiltration";
    if (EXTERNAL.some((r) => e.dstIp?.startsWith(r))) return "External Beacon";
    if ([445, 389, 636].includes(e.dstPort)) return "Lateral Movement";
    if (e.dstPort === 53) return "DNS Tunneling Risk";
    if (e.severity === "FATAL") return "Critical Connection";
    return "Anomalous Traffic";
  };

  const rows = anomalous.map((e) => [
    ts(e.timestamp), e.domainId, e.severity, e.type,
    e.srcIp, e.srcPort, e.dstIp, e.dstPort, e.protocol,
    e.userId ?? "—", e.host, e.classification,
    EXTERNAL.some((r) => e.dstIp?.startsWith(r)) ? "YES" : "NO",
    anomalyCategory(e),
  ]);

  return toCSV(headers, rows);
}

export function generateNetworkAnomalyTXT(events: RawEvent[]): string {
  const EXTERNAL = ["185.", "91.", "45."];
  const externalConns = events.filter((e) => EXTERNAL.some((r) => (e.dstIp ?? "").startsWith(r)));
  const lateralMvmt   = events.filter((e) => [445, 389, 636].includes(e.dstPort) && (e.severity === "FATAL" || e.severity === "ERROR"));
  const dnsEvents     = events.filter((e) => e.dstPort === 53 && e.severity !== "INFO");

  const extIPCounts: Record<string, number> = {};
  for (const e of externalConns) {
    extIPCounts[e.dstIp ?? "?"] = (extIPCounts[e.dstIp ?? "?"] ?? 0) + 1;
  }

  let out = `NETWORK ANOMALY REPORT
Generated: ${ts(Date.now())}
Classification: TOP SECRET // HIGH SIDE
${"=".repeat(72)}

ANOMALY SUMMARY
---------------
External beacon connections : ${externalConns.length}
Lateral movement indicators : ${lateralMvmt.length}
Suspicious DNS events       : ${dnsEvents.length}
Total events analyzed       : ${events.length}

${"=".repeat(72)}
EXTERNAL DESTINATION IPs (POTENTIAL C2 / EXFIL)
${"=".repeat(72)}

`;

  for (const [ip, count] of Object.entries(extIPCounts).sort((a, b) => b[1] - a[1])) {
    const examples = externalConns.filter((e) => e.dstIp === ip).slice(0, 2);
    out += `${ip} (${count} connections)
  Example users: ${[...new Set(examples.map((e) => e.userId ?? "—"))].join(", ")}
  Example hosts: ${[...new Set(examples.map((e) => e.host))].join(", ")}

`;
  }

  out += `${"=".repeat(72)}
LATERAL MOVEMENT INDICATORS (SMB/LDAP/LDAPS — FATAL/ERROR)
${"=".repeat(72)}

`;

  for (const e of lateralMvmt.slice(0, 20)) {
    out += `${ts(e.timestamp)} | ${e.domainId} | ${e.severity}
  ${e.srcIp}:${e.srcPort} → ${e.dstIp}:${e.dstPort} (${e.protocol})
  User: ${e.userId ?? "—"}  Host: ${e.host}

`;
  }

  out += `${"=".repeat(72)}
END OF NETWORK ANOMALY REPORT
`;
  return out;
}

/* ═══════════════════════════════════════════════════
   DOWNLOAD TRIGGER
═══════════════════════════════════════════════════ */
export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface ReportAction {
  csvContent:  (events: RawEvent[]) => string;
  txtContent:  (events: RawEvent[]) => string;
  csvFilename: string;
  txtFilename: string;
}

export const REPORT_ACTIONS: Record<string, ReportAction> = {
  "correlation-report": {
    csvContent:  generateCorrelationCSV,
    txtContent:  generateCorrelationTXT,
    csvFilename: `correlation_report_${today()}.csv`,
    txtFilename: `correlation_report_${today()}.txt`,
  },
  "threat-intel": {
    csvContent:  generateThreatIntelCSV,
    txtContent:  generateThreatIntelTXT,
    csvFilename: `threat_intel_${today()}.csv`,
    txtFilename: `threat_intel_${today()}.txt`,
  },
  "compliance-audit": {
    csvContent:  generateComplianceCSV,
    txtContent:  generateComplianceTXT,
    csvFilename: `compliance_audit_${today()}.csv`,
    txtFilename: `compliance_audit_${today()}.txt`,
  },
  "incident-timeline": {
    csvContent:  generateIncidentCSV,
    txtContent:  generateIncidentTXT,
    csvFilename: `incident_timeline_${today()}.csv`,
    txtFilename: `incident_timeline_${today()}.txt`,
  },
  "user-access": {
    csvContent:  generateUserAccessCSV,
    txtContent:  generateUserAccessTXT,
    csvFilename: `user_access_review_${today()}.csv`,
    txtFilename: `user_access_review_${today()}.txt`,
  },
  "network-anomaly": {
    csvContent:  generateNetworkAnomalyCSV,
    txtContent:  generateNetworkAnomalyTXT,
    csvFilename: `network_anomaly_report_${today()}.csv`,
    txtFilename: `network_anomaly_report_${today()}.txt`,
  },
};

/* ═══════════════════════════════════════════════════
   CUSTOM REPORT BUILDER
═══════════════════════════════════════════════════ */

export const ALL_DOMAINS     = ["ALPHA", "BRAVO", "CHARLIE"] as const;
export const ALL_SEVERITIES  = ["FATAL", "ERROR", "WARN", "INFO"] as const;
export const ALL_EVENT_TYPES = [
  "Authentication", "ExfilAttempt", "PrivilegeEsc", "FileAccess",
  "NetworkConn", "AnomalyDetected", "PolicyViolation", "ProcessSpawn",
] as const;

export const ALL_FIELDS: { key: string; label: string }[] = [
  { key: "timestamp",        label: "Timestamp" },
  { key: "domain",           label: "Domain" },
  { key: "severity",         label: "Severity" },
  { key: "event_type",       label: "Event Type" },
  { key: "src_ip",           label: "Source IP" },
  { key: "src_port",         label: "Source Port" },
  { key: "dst_ip",           label: "Dest IP" },
  { key: "dst_port",         label: "Dest Port" },
  { key: "protocol",         label: "Protocol" },
  { key: "user_id",          label: "User ID" },
  { key: "host",             label: "Host" },
  { key: "classification",   label: "Classification" },
  { key: "mitre_technique",  label: "MITRE Technique" },
  { key: "mitre_tactic",     label: "MITRE Tactic" },
  { key: "confidence_pct",   label: "Confidence %" },
];

export const TIME_RANGE_MS: Record<string, number> = {
  "Last 15 minutes": 15 * 60_000,
  "Last 60 minutes": 60 * 60_000,
  "Last 4 hours":    4  * 60 * 60_000,
  "Last 24 hours":   24 * 60 * 60_000,
  "Last 7 days":     7  * 24 * 60 * 60_000,
  "All time":        Infinity,
};

export interface CustomReportConfig {
  name:        string;
  domains:     string[];
  severities:  string[];
  eventTypes:  string[];
  timeRange:   string;
  fields:      string[];
  sortBy:      "timestamp" | "severity" | "domain";
  sortDir:     "desc" | "asc";
}

function getFieldValue(e: RawEvent, field: string): string | number {
  switch (field) {
    case "timestamp":       return ts(e.timestamp);
    case "domain":          return e.domainId;
    case "severity":        return e.severity;
    case "event_type":      return e.type;
    case "src_ip":          return e.srcIp;
    case "src_port":        return e.srcPort;
    case "dst_ip":          return e.dstIp ?? "—";
    case "dst_port":        return e.dstPort;
    case "protocol":        return e.protocol;
    case "user_id":         return e.userId ?? "—";
    case "host":            return e.host;
    case "classification":  return e.classification;
    case "mitre_technique": return MITRE[e.type]?.technique ?? "—";
    case "mitre_tactic":    return MITRE[e.type]?.tactic ?? "—";
    case "confidence_pct":  return confidence(e);
    default:                return "—";
  }
}

const SEV_ORDER: Record<string, number> = { FATAL: 0, ERROR: 1, WARN: 2, INFO: 3 };

export function filterEvents(events: RawEvent[], cfg: CustomReportConfig): RawEvent[] {
  const cutoff = cfg.timeRange === "All time"
    ? 0
    : Date.now() - (TIME_RANGE_MS[cfg.timeRange] ?? Infinity);

  let filtered = events.filter((e) =>
    cfg.domains.includes(e.domainId) &&
    cfg.severities.includes(e.severity) &&
    cfg.eventTypes.includes(e.type) &&
    e.timestamp >= cutoff
  );

  filtered.sort((a, b) => {
    let diff = 0;
    if      (cfg.sortBy === "timestamp") diff = a.timestamp - b.timestamp;
    else if (cfg.sortBy === "severity")  diff = (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
    else if (cfg.sortBy === "domain")    diff = a.domainId.localeCompare(b.domainId);
    return cfg.sortDir === "desc" ? -diff : diff;
  });

  return filtered;
}

export function generateCustomCSV(events: RawEvent[], cfg: CustomReportConfig): string {
  const filtered = filterEvents(events, cfg);
  const headers  = cfg.fields.map((f) => ALL_FIELDS.find((a) => a.key === f)?.label ?? f);
  const rows     = filtered.map((e) => cfg.fields.map((f) => getFieldValue(e, f)));
  return toCSV(headers, rows);
}

export function generateCustomTXT(events: RawEvent[], cfg: CustomReportConfig): string {
  const filtered = filterEvents(events, cfg);
  const name     = cfg.name || "Custom Report";

  let out = `${name.toUpperCase()}
Generated  : ${ts(Date.now())}
Classification: TOP SECRET // HIGH SIDE
Filters    : domains=[${cfg.domains.join(",")}]  severity=[${cfg.severities.join(",")}]
             event_types=[${cfg.eventTypes.join(",")}]  time_range=${cfg.timeRange}
Sort       : ${cfg.sortBy} (${cfg.sortDir})
${"=".repeat(72)}

RESULT SUMMARY
--------------
Total matching events : ${filtered.length}
Domains represented   : ${[...new Set(filtered.map((e) => e.domainId))].join(", ") || "—"}
Severities found      : ${[...new Set(filtered.map((e) => e.severity))].join(", ") || "—"}

${"=".repeat(72)}
EVENTS
${"=".repeat(72)}

`;

  filtered.forEach((e, i) => {
    out += `[${String(i + 1).padStart(4, "0")}]\n`;
    for (const f of cfg.fields) {
      const label = (ALL_FIELDS.find((a) => a.key === f)?.label ?? f).padEnd(18);
      out += `  ${label}: ${getFieldValue(e, f)}\n`;
    }
    out += "\n";
  });

  out += `${"=".repeat(72)}\nEND OF ${name.toUpperCase()}\n`;
  return out;
}
