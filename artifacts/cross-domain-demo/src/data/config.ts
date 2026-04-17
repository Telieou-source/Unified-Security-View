import type { DomainConfig, BoundaryRule, EventType, Classification } from "../types";

export const DOMAINS: DomainConfig[] = [
  {
    id: "ALPHA",
    name: "Domain Alpha",
    label: "ALPHA",
    color: "#4ea6dc",
    headerClass: "bg-[#1a2535] border-[#2a4060]",
    rowEvenClass: "bg-[#171e2a]",
    rowOddClass: "bg-[#1a2130]",
    borderClass: "border-[#2a4060]",
    textClass: "text-[#4ea6dc]",
    badgeStyle: "background:#1a3050;color:#4ea6dc;border:1px solid #2a4a70",
    systems: ["ALPHA-WS-001", "ALPHA-SRV-002", "ALPHA-DB-003", "ALPHA-GW-004"],
    subnet: "10.1.0.0/16",
  },
  {
    id: "BRAVO",
    name: "Domain Bravo",
    label: "BRAVO",
    color: "#48c78e",
    headerClass: "bg-[#17271f] border-[#264a38]",
    rowEvenClass: "bg-[#151e18]",
    rowOddClass: "bg-[#18221c]",
    borderClass: "border-[#264a38]",
    textClass: "text-[#48c78e]",
    badgeStyle: "background:#163025;color:#48c78e;border:1px solid #264a38",
    systems: ["BRAVO-CTRL-01", "BRAVO-APP-02", "BRAVO-VPN-03", "BRAVO-MAIL-04"],
    subnet: "10.2.0.0/16",
  },
  {
    id: "CHARLIE",
    name: "Domain Charlie",
    label: "CHARLIE",
    color: "#c9a227",
    headerClass: "bg-[#251f10] border-[#4a3c1a]",
    rowEvenClass: "bg-[#1e1810]",
    rowOddClass: "bg-[#221c12]",
    borderClass: "border-[#4a3c1a]",
    textClass: "text-[#c9a227]",
    badgeStyle: "background:#2e2510;color:#c9a227;border:1px solid #4a3c1a",
    systems: ["CHARLIE-FW-A", "CHARLIE-IDS-B", "CHARLIE-LOG-C", "CHARLIE-AD-D"],
    subnet: "10.3.0.0/16",
  },
];

export const BOUNDARY_RULES: BoundaryRule[] = [
  { field: "srcIp",           action: "PASS",  reason: "SIEM log field — network metadata" },
  { field: "dstIp",           action: "PASS",  reason: "SIEM log field — network metadata" },
  { field: "srcPort",         action: "PASS",  reason: "SIEM log field — 5-tuple" },
  { field: "dstPort",         action: "PASS",  reason: "SIEM log field — 5-tuple" },
  { field: "protocol",        action: "PASS",  reason: "SIEM log field — 5-tuple" },
  { field: "userId",          action: "PASS",  reason: "SIEM log field — identity metadata" },
  { field: "host",            action: "PASS",  reason: "SIEM log field — asset metadata" },
  { field: "eventType",       action: "PASS",  reason: "SIEM log field — classification" },
  { field: "severity",        action: "PASS",  reason: "SIEM log field — triage metadata" },
  { field: "timestamp",       action: "PASS",  reason: "SIEM log field — temporal correlation" },
  { field: "rawPacketBytes",  action: "STRIP", reason: "Raw packet capture — may contain classified payload data" },
];

export const EVENT_TYPES: EventType[] = [
  "Authentication",
  "FileAccess",
  "NetworkConn",
  "AnomalyDetected",
  "PolicyViolation",
  "ProcessSpawn",
  "ExfilAttempt",
  "PrivilegeEsc",
];

export const CLASSIFICATIONS: Classification[] = [
  "UNCLASSIFIED",
  "CONFIDENTIAL",
  "SECRET",
  "TOP SECRET",
];

export const SEVERITY_STYLE: Record<string, { cell: string; badge: string }> = {
  INFO:  { cell: "text-[#8eb8d4]",  badge: "background:#1a2d3d;color:#8eb8d4;border:1px solid #2a4a60" },
  WARN:  { cell: "text-[#e5c97a]",  badge: "background:#2d2510;color:#e5c97a;border:1px solid #5a4a20" },
  ERROR: { cell: "text-[#f58220]",  badge: "background:#2d1a08;color:#f58220;border:1px solid #6a3a10" },
  FATAL: { cell: "text-[#e55555]",  badge: "background:#2d0e0e;color:#e55555;border:1px solid #6a2020" },
};

export const CORR_SEVERITY_STYLE: Record<string, { row: string; badge: string }> = {
  MEDIUM:   { row: "border-l-[#e5c97a]", badge: "background:#2d2510;color:#e5c97a;border:1px solid #5a4a20" },
  HIGH:     { row: "border-l-[#f58220]", badge: "background:#2d1a08;color:#f58220;border:1px solid #6a3a10" },
  CRITICAL: { row: "border-l-[#e55555]", badge: "background:#2d0e0e;color:#e55555;border:1px solid #6a2020" },
};
