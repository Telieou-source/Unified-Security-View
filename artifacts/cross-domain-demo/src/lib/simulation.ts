import type {
  RawEvent,
  SanitizedEvent,
  CorrelatedAlert,
  DomainId,
  EventType,
  Classification,
} from "../types";
import {
  DOMAINS,
  EVENT_TYPES,
  CLASSIFICATIONS,
} from "../data/config";

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(): string {
  return `10.${randomFrom([1, 2, 3, 4])}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0").substring(0, 8).toUpperCase();
}

function severityForType(type: EventType): RawEvent["severity"] {
  if (type === "EXFIL_ATTEMPT" || type === "PRIVILEGE_ESC") return "CRITICAL";
  if (type === "ANOMALY_DETECTED" || type === "POLICY_VIOLATION") return "HIGH";
  if (type === "AUTH_ATTEMPT" || type === "NETWORK_CONN") return "MEDIUM";
  return "LOW";
}

export function generateEvent(domainId: DomainId): RawEvent {
  const domain = DOMAINS.find((d) => d.id === domainId)!;
  const type: EventType = randomFrom(EVENT_TYPES);
  const hostId = randomFrom(domain.systems);
  const userId = `USR-${simpleHash(hostId + Math.random().toString()).substring(0, 5)}`;
  const classification: Classification = randomFrom(CLASSIFICATIONS);

  return {
    id: nextId(`EVT-${domainId}`),
    domainId,
    timestamp: Date.now(),
    type,
    classification,
    sourceIp: randomIp(),
    userId,
    hostId,
    payload: {
      rawCmd: `cmd_${Math.random().toString(36).substring(2, 7)}`,
      bytes: Math.floor(Math.random() * 8192),
      success: Math.random() > 0.3,
    },
    severity: severityForType(type),
  };
}

export function sanitizeEvent(raw: RawEvent): SanitizedEvent {
  const strippedFields = ["sourceIp", "payload", "classification"];
  const hashedFields = ["userId", "hostId"];
  const passedFields = ["type", "severity", "timestamp", "domainId", "id"];

  return {
    id: raw.id,
    domainId: raw.domainId,
    timestamp: raw.timestamp,
    type: raw.type,
    severity: raw.severity,
    userIdHash: `SHA256:${simpleHash(raw.userId + "salt-boundary")}`,
    hostIdHash: `SHA256:${simpleHash(raw.hostId + "salt-boundary")}`,
    strippedFields,
    passedFields: [...passedFields, ...hashedFields],
  };
}

const recentByType: Map<string, number[]> = new Map();
const correlationCooldown: Map<string, number> = new Map();

export function tryCorrelate(
  sanitized: SanitizedEvent[],
  newEvent: SanitizedEvent
): CorrelatedAlert | null {
  const key = `${newEvent.type}`;
  const now = Date.now();

  const cooldownKey = `${newEvent.type}-${newEvent.domainId}`;
  if ((correlationCooldown.get(cooldownKey) ?? 0) > now - 3000) return null;

  const existing = recentByType.get(key) ?? [];
  const fresh = existing.filter((t) => now - t < 8000);
  fresh.push(now);
  recentByType.set(key, fresh);

  const domainMatches = sanitized.filter(
    (e) => e.type === newEvent.type && now - e.timestamp < 8000
  );

  const uniqueDomains = [...new Set(domainMatches.map((e) => e.domainId))];

  if (uniqueDomains.length < 2) return null;

  correlationCooldown.set(cooldownKey, now);

  const confidence = Math.min(95, 55 + uniqueDomains.length * 15 + (domainMatches.length > 4 ? 10 : 0));

  const alertTypes: CorrelatedAlert["type"][] = [
    "CORRELATED_THREAT",
    "PATTERN_MATCH",
    "CROSS_DOMAIN_ANOMALY",
    "SYNCHRONIZED_ACTIVITY",
  ];

  const summaries: Record<EventType, string> = {
    AUTH_ATTEMPT: `Simultaneous authentication attempts observed across ${uniqueDomains.join(", ")} — possible coordinated credential attack`,
    FILE_ACCESS: `Synchronized file access events across ${uniqueDomains.join(", ")} — possible lateral movement pattern`,
    NETWORK_CONN: `Correlated network connection spikes across ${uniqueDomains.join(", ")} — potential C2 beaconing`,
    ANOMALY_DETECTED: `Anomaly cluster detected across ${uniqueDomains.join(", ")} — cross-domain behavioral deviation`,
    POLICY_VIOLATION: `Policy violations synchronized across ${uniqueDomains.join(", ")} — coordinated insider threat indicator`,
    PROCESS_SPAWN: `Cross-domain process spawning pattern detected on ${uniqueDomains.join(", ")} — possible worm propagation`,
    EXFIL_ATTEMPT: `CRITICAL: Exfiltration attempts correlated across ${uniqueDomains.join(", ")} — active data breach in progress`,
    PRIVILEGE_ESC: `Privilege escalation synchronized across ${uniqueDomains.join(", ")} — coordinated compromise vector`,
  };

  const severity: CorrelatedAlert["severity"] =
    newEvent.severity === "CRITICAL"
      ? "CRITICAL"
      : newEvent.severity === "HIGH"
      ? "HIGH"
      : "MEDIUM";

  return {
    id: nextId("CORR"),
    timestamp: now,
    type: randomFrom(alertTypes),
    severity,
    domains: uniqueDomains as DomainId[],
    summary: summaries[newEvent.type],
    eventIds: domainMatches.slice(-5).map((e) => e.id),
    confidence,
  };
}
