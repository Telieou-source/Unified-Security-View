import type { DomainConfig, BoundaryRule, EventType, Classification } from "../types";

export const DOMAINS: DomainConfig[] = [
  {
    id: "ALPHA",
    name: "Domain Alpha",
    label: "ALPHA",
    color: "#38bdf8",
    bgClass: "bg-sky-950/60",
    borderClass: "border-sky-500/40",
    textClass: "text-sky-400",
    badgeClass: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
    systems: ["ALPHA-WS-001", "ALPHA-SRV-002", "ALPHA-DB-003", "ALPHA-GW-004"],
  },
  {
    id: "BRAVO",
    name: "Domain Bravo",
    label: "BRAVO",
    color: "#22c55e",
    bgClass: "bg-green-950/60",
    borderClass: "border-green-500/40",
    textClass: "text-green-400",
    badgeClass: "bg-green-500/20 text-green-300 border border-green-500/30",
    systems: ["BRAVO-CTRL-01", "BRAVO-APP-02", "BRAVO-VPN-03", "BRAVO-MAIL-04"],
  },
  {
    id: "CHARLIE",
    name: "Domain Charlie",
    label: "CHARLIE",
    color: "#fbbf24",
    bgClass: "bg-amber-950/60",
    borderClass: "border-amber-500/40",
    textClass: "text-amber-400",
    badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    systems: ["CHARLIE-FW-A", "CHARLIE-IDS-B", "CHARLIE-LOG-C", "CHARLIE-AD-D"],
  },
];

export const BOUNDARY_RULES: BoundaryRule[] = [
  { field: "sourceIp", action: "STRIP", reason: "Network topology classified" },
  { field: "userId", action: "HASH", reason: "PII — pseudonymized at boundary" },
  { field: "hostId", action: "HASH", reason: "Asset inventory classified" },
  { field: "payload", action: "STRIP", reason: "Raw payload may contain classified data" },
  { field: "classification", action: "STRIP", reason: "Classification label not propagated upward" },
  { field: "type", action: "PASS", reason: "Event category approved for sharing" },
  { field: "severity", action: "PASS", reason: "Severity level approved for sharing" },
  { field: "timestamp", action: "PASS", reason: "Timing data approved for sharing" },
];

export const EVENT_TYPES: EventType[] = [
  "AUTH_ATTEMPT",
  "FILE_ACCESS",
  "NETWORK_CONN",
  "ANOMALY_DETECTED",
  "POLICY_VIOLATION",
  "PROCESS_SPAWN",
  "EXFIL_ATTEMPT",
  "PRIVILEGE_ESC",
];

export const CLASSIFICATIONS: Classification[] = [
  "UNCLASSIFIED",
  "CONFIDENTIAL",
  "SECRET",
  "TOP SECRET",
];

export const SEVERITY_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export const SEVERITY_COLORS: Record<string, string> = {
  LOW: "text-slate-400 bg-slate-800/50 border-slate-700/50",
  MEDIUM: "text-yellow-400 bg-yellow-900/30 border-yellow-700/40",
  HIGH: "text-orange-400 bg-orange-900/30 border-orange-700/40",
  CRITICAL: "text-red-400 bg-red-900/30 border-red-700/40",
};

export const CLASSIFICATION_COLORS: Record<string, string> = {
  UNCLASSIFIED: "text-slate-400",
  CONFIDENTIAL: "text-blue-400",
  SECRET: "text-orange-400",
  "TOP SECRET": "text-red-500 font-semibold",
};
