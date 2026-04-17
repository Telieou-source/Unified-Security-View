import type { RawEvent } from "../types";

const now = Date.now();
const m = (minutesAgo: number) => now - minutesAgo * 60_000;

/* Shared hosts and users ── realistic cross-domain identities */
const HOSTS = {
  ALPHA:   ["alpha-ws-0044", "alpha-ws-0109", "alpha-srv-11", "alpha-db-03", "alpha-gw-04"],
  BRAVO:   ["bravo-ctrl-01", "bravo-app-02", "bravo-vpn-03", "bravo-mail-04", "bravo-srv-11"],
  CHARLIE: ["charlie-fw-A",  "charlie-ids-B", "charlie-log-C", "charlie-ad-D",  "charlie-ws-03"],
};

const IPS = {
  ALPHA:   ["10.1.4.22", "10.1.7.55", "10.1.9.88", "10.1.12.4", "10.1.3.200"],
  BRAVO:   ["10.2.5.33", "10.2.8.77", "10.2.11.9", "10.2.1.45", "10.2.6.120"],
  CHARLIE: ["10.3.2.66", "10.3.6.40", "10.3.9.11", "10.3.4.90", "10.3.7.33"],
};

/* Users that span domains (trigger cross-domain query) */
const CROSS_USERS = ["usr_j.harris", "usr_k.chen", "svc_relay_01", "usr_m.okonkwo"];
const ALPHA_ONLY  = ["usr_t.vasquez", "usr_a.petrov", "usr_r.kim", "svc_auth_a"];
const BRAVO_ONLY  = ["usr_l.santos",  "usr_d.park",   "svc_scan_b"];
const CHARLIE_ONLY= ["usr_f.wolf",    "usr_p.nguyen", "svc_log_c"];

function uid(i: number): string {
  return `evt-seed-${String(i).padStart(4, "0")}`;
}

function rBytes(): string {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join(" ");
}

/* ── Seed events ── */
export const SEED_EVENTS: RawEvent[] = [

  /* ── ALPHA DOMAIN ── */

  // FATAL authentication failures
  { id: uid(1),  domainId: "ALPHA", timestamp: m(3),  type: "Authentication", classification: "SECRET",       srcIp: IPS.ALPHA[0], dstIp: "10.1.0.1",     srcPort: 49221, dstPort: 389,  protocol: "TCP",  userId: CROSS_USERS[0], host: HOSTS.ALPHA[0], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(2),  domainId: "ALPHA", timestamp: m(5),  type: "Authentication", classification: "SECRET",       srcIp: IPS.ALPHA[1], dstIp: "10.1.0.1",     srcPort: 52001, dstPort: 389,  protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.ALPHA[1], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(3),  domainId: "ALPHA", timestamp: m(6),  type: "Authentication", classification: "SECRET",       srcIp: IPS.ALPHA[2], dstIp: "10.1.0.1",     srcPort: 50111, dstPort: 389,  protocol: "TCP",  userId: CROSS_USERS[2], host: HOSTS.ALPHA[2], severity: "FATAL", rawPacketBytes: rBytes() },

  // Exfil attempts
  { id: uid(4),  domainId: "ALPHA", timestamp: m(8),  type: "ExfilAttempt",  classification: "TOP SECRET",   srcIp: IPS.ALPHA[0], dstIp: "185.220.101.47", srcPort: 54321, dstPort: 443,  protocol: "TCP",  userId: CROSS_USERS[0], host: HOSTS.ALPHA[0], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(5),  domainId: "ALPHA", timestamp: m(14), type: "ExfilAttempt",  classification: "TOP SECRET",   srcIp: IPS.ALPHA[3], dstIp: "45.83.65.200",  srcPort: 49876, dstPort: 8443, protocol: "TCP",  userId: ALPHA_ONLY[0],  host: HOSTS.ALPHA[3], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(6),  domainId: "ALPHA", timestamp: m(22), type: "ExfilAttempt",  classification: "SECRET",       srcIp: IPS.ALPHA[1], dstIp: "91.108.4.11",   srcPort: 60021, dstPort: 443,  protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.ALPHA[1], severity: "ERROR", rawPacketBytes: rBytes() },

  // Privilege escalations
  { id: uid(7),  domainId: "ALPHA", timestamp: m(9),  type: "PrivilegeEsc",  classification: "SECRET",       srcIp: IPS.ALPHA[2], dstIp: "10.1.0.50",    srcPort: 44512, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[2], host: HOSTS.ALPHA[2], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(8),  domainId: "ALPHA", timestamp: m(17), type: "PrivilegeEsc",  classification: "CONFIDENTIAL", srcIp: IPS.ALPHA[4], dstIp: "10.1.0.50",    srcPort: 51200, dstPort: 445,  protocol: "TCP",  userId: ALPHA_ONLY[1],  host: HOSTS.ALPHA[4], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(9),  domainId: "ALPHA", timestamp: m(31), type: "PrivilegeEsc",  classification: "CONFIDENTIAL", srcIp: IPS.ALPHA[0], dstIp: "10.1.0.50",    srcPort: 53400, dstPort: 445,  protocol: "TCP",  userId: ALPHA_ONLY[2],  host: HOSTS.ALPHA[0], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(10), domainId: "ALPHA", timestamp: m(48), type: "PrivilegeEsc",  classification: "CONFIDENTIAL", srcIp: IPS.ALPHA[3], dstIp: "10.1.0.50",    srcPort: 49001, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.ALPHA[3], severity: "WARN",  rawPacketBytes: rBytes() },

  // File access
  { id: uid(11), domainId: "ALPHA", timestamp: m(11), type: "FileAccess",    classification: "SECRET",       srcIp: IPS.ALPHA[0], dstIp: "10.1.5.10",    srcPort: 50022, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.ALPHA[0], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(12), domainId: "ALPHA", timestamp: m(18), type: "FileAccess",    classification: "SECRET",       srcIp: IPS.ALPHA[1], dstIp: "10.1.5.10",    srcPort: 60011, dstPort: 445,  protocol: "TCP",  userId: ALPHA_ONLY[0],  host: HOSTS.ALPHA[1], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(13), domainId: "ALPHA", timestamp: m(25), type: "FileAccess",    classification: "CONFIDENTIAL", srcIp: IPS.ALPHA[2], dstIp: "10.1.5.10",    srcPort: 55100, dstPort: 445,  protocol: "TCP",  userId: ALPHA_ONLY[3],  host: HOSTS.ALPHA[2], severity: "INFO",  rawPacketBytes: rBytes() },

  // Network connections
  { id: uid(14), domainId: "ALPHA", timestamp: m(2),  type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.ALPHA[0], dstIp: "185.220.101.47", srcPort: 49222, dstPort: 53,   protocol: "UDP",  userId: CROSS_USERS[0], host: HOSTS.ALPHA[0], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(15), domainId: "ALPHA", timestamp: m(4),  type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.ALPHA[3], dstIp: "10.0.0.1",      srcPort: 58000, dstPort: 80,   protocol: "TCP",  userId: ALPHA_ONLY[1],  host: HOSTS.ALPHA[3], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(16), domainId: "ALPHA", timestamp: m(37), type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.ALPHA[4], dstIp: "10.1.9.1",      srcPort: 44001, dstPort: 443,  protocol: "TCP",  userId: ALPHA_ONLY[2],  host: HOSTS.ALPHA[4], severity: "INFO",  rawPacketBytes: rBytes() },

  // Anomalies / policy violations
  { id: uid(17), domainId: "ALPHA", timestamp: m(13), type: "AnomalyDetected", classification: "SECRET",    srcIp: IPS.ALPHA[1], dstIp: "10.1.0.1",     srcPort: 56788, dstPort: 8080, protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.ALPHA[1], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(18), domainId: "ALPHA", timestamp: m(44), type: "PolicyViolation", classification: "SECRET",    srcIp: IPS.ALPHA[2], dstIp: "10.1.2.3",     srcPort: 63200, dstPort: 443,  protocol: "TCP",  userId: ALPHA_ONLY[0],  host: HOSTS.ALPHA[2], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(19), domainId: "ALPHA", timestamp: m(52), type: "ProcessSpawn",    classification: "CONFIDENTIAL", srcIp: IPS.ALPHA[0], dstIp: "10.1.0.1",  srcPort: 47000, dstPort: 445,  protocol: "TCP",  userId: ALPHA_ONLY[3],  host: HOSTS.ALPHA[0], severity: "WARN",  rawPacketBytes: rBytes() },

  /* ── BRAVO DOMAIN ── */

  // FATAL events
  { id: uid(20), domainId: "BRAVO", timestamp: m(7),  type: "Authentication", classification: "TOP SECRET",  srcIp: IPS.BRAVO[0], dstIp: "10.2.0.1",     srcPort: 49999, dstPort: 636,  protocol: "TCP",  userId: CROSS_USERS[0], host: HOSTS.BRAVO[0], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(21), domainId: "BRAVO", timestamp: m(10), type: "Authentication", classification: "TOP SECRET",  srcIp: IPS.BRAVO[2], dstIp: "10.2.0.1",     srcPort: 52200, dstPort: 636,  protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.BRAVO[2], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(22), domainId: "BRAVO", timestamp: m(15), type: "ExfilAttempt",   classification: "TOP SECRET",  srcIp: IPS.BRAVO[1], dstIp: "91.108.56.10", srcPort: 61001, dstPort: 443,  protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.BRAVO[1], severity: "FATAL", rawPacketBytes: rBytes() },

  // Privilege escalations
  { id: uid(23), domainId: "BRAVO", timestamp: m(7),  type: "PrivilegeEsc",   classification: "SECRET",      srcIp: IPS.BRAVO[0], dstIp: "10.2.0.50",    srcPort: 53001, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[0], host: HOSTS.BRAVO[0], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(24), domainId: "BRAVO", timestamp: m(24), type: "PrivilegeEsc",   classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[3], dstIp: "10.2.0.50",   srcPort: 50009, dstPort: 445,  protocol: "TCP",  userId: BRAVO_ONLY[0],  host: HOSTS.BRAVO[3], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(25), domainId: "BRAVO", timestamp: m(38), type: "PrivilegeEsc",   classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[4], dstIp: "10.2.0.50",   srcPort: 47100, dstPort: 445,  protocol: "TCP",  userId: BRAVO_ONLY[1],  host: HOSTS.BRAVO[4], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(26), domainId: "BRAVO", timestamp: m(55), type: "PrivilegeEsc",   classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[1], dstIp: "10.2.0.50",   srcPort: 62300, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[2], host: HOSTS.BRAVO[1], severity: "WARN",  rawPacketBytes: rBytes() },

  // ExfilAttempt
  { id: uid(27), domainId: "BRAVO", timestamp: m(12), type: "ExfilAttempt",   classification: "SECRET",      srcIp: IPS.BRAVO[2], dstIp: "185.220.101.48", srcPort: 55555, dstPort: 443, protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.BRAVO[2], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(28), domainId: "BRAVO", timestamp: m(29), type: "ExfilAttempt",   classification: "SECRET",      srcIp: IPS.BRAVO[0], dstIp: "45.83.65.201",  srcPort: 49100, dstPort: 8443, protocol: "TCP", userId: BRAVO_ONLY[0],  host: HOSTS.BRAVO[0], severity: "ERROR", rawPacketBytes: rBytes() },

  // File access + network
  { id: uid(29), domainId: "BRAVO", timestamp: m(16), type: "FileAccess",     classification: "SECRET",      srcIp: IPS.BRAVO[3], dstIp: "10.2.5.10",    srcPort: 50088, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.BRAVO[3], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(30), domainId: "BRAVO", timestamp: m(20), type: "FileAccess",     classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[4], dstIp: "10.2.5.10",   srcPort: 57800, dstPort: 445,  protocol: "TCP",  userId: BRAVO_ONLY[1],  host: HOSTS.BRAVO[4], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(31), domainId: "BRAVO", timestamp: m(33), type: "FileAccess",     classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[1], dstIp: "10.2.5.10",   srcPort: 60422, dstPort: 445,  protocol: "TCP",  userId: BRAVO_ONLY[2],  host: HOSTS.BRAVO[1], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(32), domainId: "BRAVO", timestamp: m(41), type: "NetworkConn",    classification: "UNCLASSIFIED", srcIp: IPS.BRAVO[0], dstIp: "10.2.0.1",    srcPort: 49800, dstPort: 80,   protocol: "TCP",  userId: BRAVO_ONLY[0],  host: HOSTS.BRAVO[0], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(33), domainId: "BRAVO", timestamp: m(46), type: "NetworkConn",    classification: "UNCLASSIFIED", srcIp: IPS.BRAVO[2], dstIp: "10.2.9.1",    srcPort: 44322, dstPort: 443,  protocol: "TCP",  userId: BRAVO_ONLY[1],  host: HOSTS.BRAVO[2], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(34), domainId: "BRAVO", timestamp: m(19), type: "AnomalyDetected", classification: "SECRET",      srcIp: IPS.BRAVO[3], dstIp: "10.2.0.1",    srcPort: 59200, dstPort: 8080, protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.BRAVO[3], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(35), domainId: "BRAVO", timestamp: m(50), type: "PolicyViolation", classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[4], dstIp: "10.2.1.1",   srcPort: 44900, dstPort: 443,  protocol: "TCP",  userId: BRAVO_ONLY[0],  host: HOSTS.BRAVO[4], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(36), domainId: "BRAVO", timestamp: m(57), type: "ProcessSpawn",    classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[0], dstIp: "10.2.0.1",    srcPort: 48200, dstPort: 445, protocol: "TCP",  userId: BRAVO_ONLY[2],  host: HOSTS.BRAVO[0], severity: "WARN",  rawPacketBytes: rBytes() },

  /* ── CHARLIE DOMAIN ── */

  // FATAL events
  { id: uid(37), domainId: "CHARLIE", timestamp: m(6),  type: "Authentication", classification: "TOP SECRET", srcIp: IPS.CHARLIE[0], dstIp: "10.3.0.1",    srcPort: 53000, dstPort: 636,  protocol: "TCP",  userId: CROSS_USERS[2], host: HOSTS.CHARLIE[0], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(38), domainId: "CHARLIE", timestamp: m(11), type: "Authentication", classification: "TOP SECRET", srcIp: IPS.CHARLIE[2], dstIp: "10.3.0.1",    srcPort: 49300, dstPort: 636,  protocol: "TCP",  userId: CROSS_USERS[0], host: HOSTS.CHARLIE[2], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(39), domainId: "CHARLIE", timestamp: m(19), type: "ExfilAttempt",   classification: "TOP SECRET", srcIp: IPS.CHARLIE[1], dstIp: "91.108.56.11", srcPort: 62000, dstPort: 443, protocol: "TCP",  userId: CROSS_USERS[2], host: HOSTS.CHARLIE[1], severity: "FATAL", rawPacketBytes: rBytes() },

  // Privilege escalations
  { id: uid(40), domainId: "CHARLIE", timestamp: m(8),  type: "PrivilegeEsc",  classification: "SECRET",      srcIp: IPS.CHARLIE[2], dstIp: "10.3.0.50",   srcPort: 53400, dstPort: 445, protocol: "TCP",  userId: CROSS_USERS[0], host: HOSTS.CHARLIE[2], severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(41), domainId: "CHARLIE", timestamp: m(21), type: "PrivilegeEsc",  classification: "CONFIDENTIAL", srcIp: IPS.CHARLIE[3], dstIp: "10.3.0.50",  srcPort: 44000, dstPort: 445, protocol: "TCP",  userId: CHARLIE_ONLY[0], host: HOSTS.CHARLIE[3], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(42), domainId: "CHARLIE", timestamp: m(42), type: "PrivilegeEsc",  classification: "CONFIDENTIAL", srcIp: IPS.CHARLIE[4], dstIp: "10.3.0.50",  srcPort: 61700, dstPort: 445, protocol: "TCP",  userId: CHARLIE_ONLY[1], host: HOSTS.CHARLIE[4], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(43), domainId: "CHARLIE", timestamp: m(58), type: "PrivilegeEsc",  classification: "CONFIDENTIAL", srcIp: IPS.CHARLIE[0], dstIp: "10.3.0.50",  srcPort: 47900, dstPort: 445, protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.CHARLIE[0], severity: "WARN",  rawPacketBytes: rBytes() },

  // ExfilAttempt
  { id: uid(44), domainId: "CHARLIE", timestamp: m(9),  type: "ExfilAttempt",  classification: "TOP SECRET",  srcIp: IPS.CHARLIE[0], dstIp: "185.220.101.49", srcPort: 58001, dstPort: 443, protocol: "TCP", userId: CROSS_USERS[3], host: HOSTS.CHARLIE[0], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(45), domainId: "CHARLIE", timestamp: m(32), type: "ExfilAttempt",  classification: "SECRET",      srcIp: IPS.CHARLIE[3], dstIp: "45.83.65.202",  srcPort: 50300, dstPort: 8443, protocol: "TCP", userId: CHARLIE_ONLY[0], host: HOSTS.CHARLIE[3], severity: "ERROR", rawPacketBytes: rBytes() },

  // File access + network
  { id: uid(46), domainId: "CHARLIE", timestamp: m(13), type: "FileAccess",    classification: "TOP SECRET",  srcIp: IPS.CHARLIE[1], dstIp: "10.3.5.10",   srcPort: 55200, dstPort: 445, protocol: "TCP",  userId: CROSS_USERS[2], host: HOSTS.CHARLIE[1], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(47), domainId: "CHARLIE", timestamp: m(23), type: "FileAccess",    classification: "SECRET",      srcIp: IPS.CHARLIE[2], dstIp: "10.3.5.10",   srcPort: 44500, dstPort: 445, protocol: "TCP",  userId: CHARLIE_ONLY[1], host: HOSTS.CHARLIE[2], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(48), domainId: "CHARLIE", timestamp: m(35), type: "FileAccess",    classification: "CONFIDENTIAL", srcIp: IPS.CHARLIE[4], dstIp: "10.3.5.10",  srcPort: 62100, dstPort: 445, protocol: "TCP",  userId: CHARLIE_ONLY[2], host: HOSTS.CHARLIE[4], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(49), domainId: "CHARLIE", timestamp: m(26), type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.CHARLIE[0], dstIp: "10.3.0.1",   srcPort: 48300, dstPort: 80,  protocol: "TCP",  userId: CHARLIE_ONLY[0], host: HOSTS.CHARLIE[0], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(50), domainId: "CHARLIE", timestamp: m(43), type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.CHARLIE[3], dstIp: "10.3.9.1",   srcPort: 56700, dstPort: 443, protocol: "TCP",  userId: CHARLIE_ONLY[1], host: HOSTS.CHARLIE[3], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(51), domainId: "CHARLIE", timestamp: m(16), type: "AnomalyDetected", classification: "SECRET",    srcIp: IPS.CHARLIE[1], dstIp: "10.3.0.1",   srcPort: 60100, dstPort: 8080, protocol: "TCP", userId: CROSS_USERS[0], host: HOSTS.CHARLIE[1], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(52), domainId: "CHARLIE", timestamp: m(47), type: "PolicyViolation", classification: "CONFIDENTIAL", srcIp: IPS.CHARLIE[4], dstIp: "10.3.1.1", srcPort: 44800, dstPort: 443, protocol: "TCP", userId: CHARLIE_ONLY[2], host: HOSTS.CHARLIE[4], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(53), domainId: "CHARLIE", timestamp: m(54), type: "ProcessSpawn",   classification: "CONFIDENTIAL", srcIp: IPS.CHARLIE[0], dstIp: "10.3.0.1",  srcPort: 48100, dstPort: 445, protocol: "TCP", userId: CHARLIE_ONLY[0], host: HOSTS.CHARLIE[0], severity: "WARN",  rawPacketBytes: rBytes() },

  /* ── Additional cross-domain activity (fuels dc(domain) query) ── */

  { id: uid(54), domainId: "BRAVO",   timestamp: m(4),  type: "Authentication", classification: "SECRET",      srcIp: IPS.BRAVO[1],   dstIp: "10.2.0.1",   srcPort: 59500, dstPort: 636,  protocol: "TCP",  userId: CROSS_USERS[0], host: HOSTS.BRAVO[1],   severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(55), domainId: "CHARLIE", timestamp: m(5),  type: "Authentication", classification: "SECRET",      srcIp: IPS.CHARLIE[2], dstIp: "10.3.0.1",   srcPort: 57400, dstPort: 636,  protocol: "TCP",  userId: CROSS_USERS[0], host: HOSTS.CHARLIE[2], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(56), domainId: "ALPHA",   timestamp: m(3),  type: "FileAccess",    classification: "SECRET",       srcIp: IPS.ALPHA[3],   dstIp: "10.1.5.10",  srcPort: 50900, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.ALPHA[3],   severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(57), domainId: "CHARLIE", timestamp: m(4),  type: "FileAccess",    classification: "TOP SECRET",   srcIp: IPS.CHARLIE[3], dstIp: "10.3.5.10",  srcPort: 50700, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.CHARLIE[3], severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(58), domainId: "BRAVO",   timestamp: m(6),  type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.BRAVO[4],   dstIp: "10.2.9.5",   srcPort: 44100, dstPort: 80,   protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.BRAVO[4],   severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(59), domainId: "CHARLIE", timestamp: m(8),  type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.CHARLIE[4], dstIp: "10.3.9.5",   srcPort: 45800, dstPort: 80,   protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.CHARLIE[4], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(60), domainId: "ALPHA",   timestamp: m(2),  type: "PrivilegeEsc",  classification: "SECRET",       srcIp: IPS.ALPHA[1],   dstIp: "10.1.0.50",  srcPort: 59900, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.ALPHA[1],   severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(61), domainId: "BRAVO",   timestamp: m(3),  type: "PrivilegeEsc",  classification: "SECRET",       srcIp: IPS.BRAVO[3],   dstIp: "10.2.0.50",  srcPort: 52800, dstPort: 445,  protocol: "TCP",  userId: CROSS_USERS[3], host: HOSTS.BRAVO[3],   severity: "FATAL", rawPacketBytes: rBytes() },

  /* ── INFO-level background traffic (realistic noise) ── */
  { id: uid(62), domainId: "ALPHA",   timestamp: m(1),  type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.ALPHA[0],   dstIp: "8.8.8.8",    srcPort: 44200, dstPort: 53,   protocol: "UDP",  userId: ALPHA_ONLY[1],  host: HOSTS.ALPHA[0],   severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(63), domainId: "BRAVO",   timestamp: m(1),  type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.BRAVO[1],   dstIp: "8.8.4.4",    srcPort: 45900, dstPort: 53,   protocol: "UDP",  userId: BRAVO_ONLY[1],  host: HOSTS.BRAVO[1],   severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(64), domainId: "CHARLIE", timestamp: m(1),  type: "NetworkConn",   classification: "UNCLASSIFIED", srcIp: IPS.CHARLIE[0], dstIp: "1.1.1.1",    srcPort: 47300, dstPort: 53,   protocol: "UDP",  userId: CHARLIE_ONLY[1], host: HOSTS.CHARLIE[0], severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(65), domainId: "ALPHA",   timestamp: m(0),  type: "Authentication", classification: "CONFIDENTIAL", srcIp: IPS.ALPHA[2],  dstIp: "10.1.0.1",   srcPort: 44400, dstPort: 389,  protocol: "TCP",  userId: ALPHA_ONLY[2],  host: HOSTS.ALPHA[2],   severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(66), domainId: "BRAVO",   timestamp: m(0),  type: "Authentication", classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[2],  dstIp: "10.2.0.1",   srcPort: 48600, dstPort: 389,  protocol: "TCP",  userId: BRAVO_ONLY[2],  host: HOSTS.BRAVO[2],   severity: "INFO",  rawPacketBytes: rBytes() },
  { id: uid(67), domainId: "CHARLIE", timestamp: m(0),  type: "Authentication", classification: "CONFIDENTIAL", srcIp: IPS.CHARLIE[3], dstIp: "10.3.0.1",  srcPort: 50400, dstPort: 389,  protocol: "TCP",  userId: CHARLIE_ONLY[2], host: HOSTS.CHARLIE[3], severity: "INFO",  rawPacketBytes: rBytes() },

  /* ── Older events for time-range testing ── */
  { id: uid(68), domainId: "ALPHA",   timestamp: m(90),  type: "ExfilAttempt",  classification: "SECRET",      srcIp: IPS.ALPHA[4],   dstIp: "185.220.101.50", srcPort: 51900, dstPort: 443, protocol: "TCP",  userId: ALPHA_ONLY[0],  host: HOSTS.ALPHA[4],   severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(69), domainId: "BRAVO",   timestamp: m(120), type: "PrivilegeEsc",  classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[0],  dstIp: "10.2.0.50",  srcPort: 48700, dstPort: 445,  protocol: "TCP",  userId: BRAVO_ONLY[0],  host: HOSTS.BRAVO[0],   severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(70), domainId: "CHARLIE", timestamp: m(180), type: "FileAccess",    classification: "SECRET",      srcIp: IPS.CHARLIE[2], dstIp: "10.3.5.10",  srcPort: 57100, dstPort: 445,  protocol: "TCP",  userId: CHARLIE_ONLY[0], host: HOSTS.CHARLIE[2], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(71), domainId: "ALPHA",   timestamp: m(240), type: "Authentication", classification: "CONFIDENTIAL", srcIp: IPS.ALPHA[3], dstIp: "10.1.0.1",   srcPort: 54900, dstPort: 389,  protocol: "TCP",  userId: CROSS_USERS[1], host: HOSTS.ALPHA[3],   severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(72), domainId: "BRAVO",   timestamp: m(360), type: "AnomalyDetected", classification: "SECRET",    srcIp: IPS.BRAVO[3],  dstIp: "10.2.0.1",   srcPort: 44600, dstPort: 8080, protocol: "TCP",  userId: BRAVO_ONLY[1],  host: HOSTS.BRAVO[3],   severity: "ERROR", rawPacketBytes: rBytes() },
  { id: uid(73), domainId: "CHARLIE", timestamp: m(480), type: "PolicyViolation", classification: "SECRET",    srcIp: IPS.CHARLIE[4], dstIp: "10.3.1.1",  srcPort: 49700, dstPort: 443,  protocol: "TCP",  userId: CHARLIE_ONLY[1], host: HOSTS.CHARLIE[4], severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(74), domainId: "ALPHA",   timestamp: m(1440), type: "ExfilAttempt", classification: "TOP SECRET",  srcIp: IPS.ALPHA[1],  dstIp: "185.220.101.51", srcPort: 62900, dstPort: 443, protocol: "TCP",  userId: CROSS_USERS[2], host: HOSTS.ALPHA[1],   severity: "FATAL", rawPacketBytes: rBytes() },
  { id: uid(75), domainId: "BRAVO",   timestamp: m(2880), type: "PrivilegeEsc", classification: "CONFIDENTIAL", srcIp: IPS.BRAVO[2], dstIp: "10.2.0.50",  srcPort: 49400, dstPort: 445,  protocol: "TCP",  userId: BRAVO_ONLY[2],  host: HOSTS.BRAVO[2],   severity: "WARN",  rawPacketBytes: rBytes() },
  { id: uid(76), domainId: "CHARLIE", timestamp: m(5760), type: "FileAccess",   classification: "SECRET",      srcIp: IPS.CHARLIE[1], dstIp: "10.3.5.10",  srcPort: 60800, dstPort: 445,  protocol: "TCP",  userId: CHARLIE_ONLY[2], host: HOSTS.CHARLIE[1], severity: "INFO",  rawPacketBytes: rBytes() },
];
