export type DomainId = "ALPHA" | "BRAVO" | "CHARLIE";

export type Classification = "UNCLASSIFIED" | "CONFIDENTIAL" | "SECRET" | "TOP SECRET";

export type EventType =
  | "Authentication"
  | "FileAccess"
  | "NetworkConn"
  | "AnomalyDetected"
  | "PolicyViolation"
  | "ProcessSpawn"
  | "ExfilAttempt"
  | "PrivilegeEsc";

export interface RawEvent {
  id: string;
  domainId: DomainId;
  timestamp: number;
  type: EventType;
  classification: Classification;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: "TCP" | "UDP" | "ICMP";
  userId: string;
  host: string;
  rawPacketBytes: string;
  severity: "INFO" | "WARN" | "ERROR" | "FATAL";
}

export interface SanitizedEvent {
  id: string;
  domainId: DomainId;
  timestamp: number;
  type: EventType;
  severity: "INFO" | "WARN" | "ERROR" | "FATAL";
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: "TCP" | "UDP" | "ICMP";
  userId: string;
  host: string;
  strippedFields: string[];
  passedFields: string[];
  sanitizationTimestamp?: number;
  guardId?: string;
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
  ruleId: string;
}

export interface BoundaryRule {
  field: string;
  action: "STRIP" | "PASS";
  reason: string;
}

export interface DomainConfig {
  id: DomainId;
  name: string;
  label: string;
  color: string;
  headerClass: string;
  rowEvenClass: string;
  rowOddClass: string;
  borderClass: string;
  textClass: string;
  badgeStyle: string;
  systems: string[];
  subnet: string;
}
