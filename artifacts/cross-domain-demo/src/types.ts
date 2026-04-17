export type DomainId = "ALPHA" | "BRAVO" | "CHARLIE";

export type Classification = "UNCLASSIFIED" | "CONFIDENTIAL" | "SECRET" | "TOP SECRET";

export type EventType =
  | "AUTH_ATTEMPT"
  | "FILE_ACCESS"
  | "NETWORK_CONN"
  | "ANOMALY_DETECTED"
  | "POLICY_VIOLATION"
  | "PROCESS_SPAWN"
  | "EXFIL_ATTEMPT"
  | "PRIVILEGE_ESC";

export interface RawEvent {
  id: string;
  domainId: DomainId;
  timestamp: number;
  type: EventType;
  classification: Classification;
  sourceIp: string;
  userId: string;
  hostId: string;
  payload: Record<string, string | number | boolean>;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface SanitizedEvent {
  id: string;
  domainId: DomainId;
  timestamp: number;
  type: EventType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  hostIdHash: string;
  userIdHash: string;
  strippedFields: string[];
  passedFields: string[];
}

export interface CorrelatedAlert {
  id: string;
  timestamp: number;
  type: "CORRELATED_THREAT" | "PATTERN_MATCH" | "CROSS_DOMAIN_ANOMALY" | "SYNCHRONIZED_ACTIVITY";
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  domains: DomainId[];
  summary: string;
  eventIds: string[];
  confidence: number;
}

export interface BoundaryRule {
  field: string;
  action: "STRIP" | "HASH" | "PASS";
  reason: string;
}

export interface DomainConfig {
  id: DomainId;
  name: string;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  systems: string[];
}
