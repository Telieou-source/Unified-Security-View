import type {
  RawEvent,
  SanitizedEvent,
  CorrelatedAlert,
  DomainId,
  EventType,
} from "../types";
import { DOMAINS, EVENT_TYPES } from "../data/config";

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}-${(++idCounter).toString().padStart(5, "0")}`;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(subnet: string): string {
  const base = subnet.split(".").slice(0, 2).join(".");
  return `${base}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

function randomPort(wellKnown = false): number {
  if (wellKnown) return randomFrom([22, 80, 443, 445, 3389, 1433, 5985, 636, 389]);
  return Math.floor(Math.random() * 60000) + 1024;
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
  ).join("");
}

function severityForType(type: EventType): RawEvent["severity"] {
  if (type === "ExfilAttempt" || type === "PrivilegeEsc") return "FATAL";
  if (type === "AnomalyDetected" || type === "PolicyViolation") return "ERROR";
  if (type === "Authentication" || type === "NetworkConn") return "WARN";
  return "INFO";
}

const USER_POOL = [
  "jsmith", "alopez", "rchandra", "mwilliams", "kberg",
  "tpatel", "schen", "dnguyen", "efoster", "lmartin",
  "svc-backup", "svc-monitor", "svc-deploy", "admin", "root",
];

export function generateEvent(domainId: DomainId): RawEvent {
  const domain = DOMAINS.find((d) => d.id === domainId)!;
  const type: EventType = randomFrom(EVENT_TYPES);
  const host = randomFrom(domain.systems);
  const userId = randomFrom(USER_POOL);
  const proto = randomFrom(["TCP", "TCP", "TCP", "UDP", "ICMP"] as const);

  return {
    id: nextId(`EVT`),
    domainId,
    timestamp: Date.now(),
    type,
    classification: "UNCLASSIFIED",
    srcIp: randomIp(domain.subnet),
    dstIp: randomIp(domain.subnet),
    srcPort: randomPort(false),
    dstPort: randomPort(true),
    protocol: proto,
    userId,
    host,
    rawPacketBytes: randomHex(32),
    severity: severityForType(type),
  };
}

/** Only raw packet bytes are stripped. All SIEM log metadata passes through. */
export function sanitizeEvent(raw: RawEvent): SanitizedEvent {
  const strippedFields = ["rawPacketBytes"];
  const passedFields = [
    "srcIp", "dstIp", "srcPort", "dstPort", "protocol",
    "userId", "host", "eventType", "severity", "timestamp",
  ];

  return {
    id: raw.id,
    domainId: raw.domainId,
    timestamp: raw.timestamp,
    type: raw.type,
    severity: raw.severity,
    srcIp: raw.srcIp,
    dstIp: raw.dstIp,
    srcPort: raw.srcPort,
    dstPort: raw.dstPort,
    protocol: raw.protocol,
    userId: raw.userId,
    host: raw.host,
    strippedFields,
    passedFields,
  };
}

const correlationCooldown: Map<string, number> = new Map();

const RULE_IDS: Record<EventType, string> = {
  Authentication:  "XDOM-AUTH-001",
  FileAccess:      "XDOM-FILE-002",
  NetworkConn:     "XDOM-NET-003",
  AnomalyDetected: "XDOM-ANOM-004",
  PolicyViolation: "XDOM-POL-005",
  ProcessSpawn:    "XDOM-PROC-006",
  ExfilAttempt:    "XDOM-EXFIL-007",
  PrivilegeEsc:    "XDOM-PRIV-008",
};

export function tryCorrelate(
  sanitized: SanitizedEvent[],
  newEvent: SanitizedEvent
): CorrelatedAlert | null {
  const now = Date.now();
  const cooldownKey = `${newEvent.type}-${newEvent.domainId}`;
  if ((correlationCooldown.get(cooldownKey) ?? 0) > now - 4000) return null;

  const windowMs = 10000;
  const domainMatches = sanitized.filter(
    (e) => e.type === newEvent.type && now - e.timestamp < windowMs
  );

  const uniqueDomains = [...new Set(domainMatches.map((e) => e.domainId))];
  if (uniqueDomains.length < 2) return null;

  correlationCooldown.set(cooldownKey, now);

  const confidence = Math.min(97, 50 + uniqueDomains.length * 18 + Math.min(domainMatches.length * 3, 15));

  const alertTypes: CorrelatedAlert["type"][] = [
    "CORRELATED_THREAT", "PATTERN_MATCH", "CROSS_DOMAIN_ANOMALY", "SYNCHRONIZED_ACTIVITY",
  ];

  const summaries: Record<EventType, string> = {
    Authentication:  `Cross-domain auth events on ${uniqueDomains.join(", ")} within ${windowMs/1000}s window — credential spray or shared account activity`,
    FileAccess:      `Correlated file access across ${uniqueDomains.join(", ")} — lateral movement / shared resource abuse`,
    NetworkConn:     `Synchronized outbound connections on ${uniqueDomains.join(", ")} — possible C2 beaconing`,
    AnomalyDetected: `Behavioral anomalies correlated across ${uniqueDomains.join(", ")} — coordinated deviation from baseline`,
    PolicyViolation: `Policy violations on ${uniqueDomains.join(", ")} within correlation window — insider threat or misconfiguration campaign`,
    ProcessSpawn:    `Abnormal process spawn pattern across ${uniqueDomains.join(", ")} — worm propagation or coordinated execution`,
    ExfilAttempt:    `CRITICAL: Exfiltration events correlated across ${uniqueDomains.join(", ")} — active multi-domain data loss incident`,
    PrivilegeEsc:    `Privilege escalation detected on ${uniqueDomains.join(", ")} in same window — coordinated compromise attempt`,
  };

  const severity: CorrelatedAlert["severity"] =
    newEvent.severity === "FATAL" ? "CRITICAL"
    : newEvent.severity === "ERROR" ? "HIGH"
    : "MEDIUM";

  return {
    id: nextId("CORR"),
    timestamp: now,
    type: randomFrom(alertTypes),
    severity,
    domains: uniqueDomains as DomainId[],
    summary: summaries[newEvent.type],
    eventIds: domainMatches.slice(-6).map((e) => e.id),
    confidence,
    ruleId: RULE_IDS[newEvent.type],
  };
}
