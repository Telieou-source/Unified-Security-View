import type { CorrelatedAlert } from "../types";

interface Props {
  alert: CorrelatedAlert;
  onClose: () => void;
}

const DOMAIN_COLOR: Record<string, string> = {
  ALPHA:   "#4ea6dc",
  BRAVO:   "#48c78e",
  CHARLIE: "#c9a227",
};

const SEV: Record<string, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#e55555", bg: "#2d0e0e", border: "#6a2020" },
  HIGH:     { color: "#f58220", bg: "#2d1a08", border: "#6a3a10" },
  MEDIUM:   { color: "#e5c97a", bg: "#2d2510", border: "#5a4a20" },
};

const TYPE_LABEL: Record<string, string> = {
  CORRELATED_THREAT:     "Correlated Threat",
  PATTERN_MATCH:         "Pattern Match",
  CROSS_DOMAIN_ANOMALY:  "Cross-Domain Anomaly",
  SYNCHRONIZED_ACTIVITY: "Synchronized Activity",
};

const MITRE: Record<string, { tactic: string; technique: string; id: string }[]> = {
  CORRELATED_THREAT:     [{ tactic: "Initial Access",  technique: "Valid Accounts",                   id: "T1078" },
                          { tactic: "Lateral Movement", technique: "Pass the Hash",                    id: "T1550.002" }],
  PATTERN_MATCH:         [{ tactic: "Discovery",       technique: "Network Service Discovery",         id: "T1046" }],
  CROSS_DOMAIN_ANOMALY:  [{ tactic: "Exfiltration",    technique: "Exfiltration Over C2 Channel",      id: "T1041" },
                          { tactic: "Collection",       technique: "Data from Information Repositories",id: "T1213" }],
  SYNCHRONIZED_ACTIVITY: [{ tactic: "Execution",       technique: "Scheduled Task/Job",               id: "T1053" },
                          { tactic: "Persistence",     technique: "Account Manipulation",              id: "T1098" }],
};

const RECOMMENDED: Record<string, string[]> = {
  CORRELATED_THREAT: [
    "Isolate the affected hosts on each domain",
    "Force credential rotation for all referenced user IDs",
    "Review firewall ACLs between domain trust boundaries",
    "Initiate a full memory acquisition on the pivot host",
  ],
  PATTERN_MATCH: [
    "Verify legitimacy of network discovery activity with asset owners",
    "Check for unauthorized scanning tools in endpoint telemetry",
    "Validate port exposure in network segmentation policy",
  ],
  CROSS_DOMAIN_ANOMALY: [
    "Suspend data egress on all implicated interfaces",
    "Engage DLP team to trace data lineage",
    "Review guard appliance policy for relevant content types",
    "Preserve audit trail for forensic analysis",
  ],
  SYNCHRONIZED_ACTIVITY: [
    "Audit all scheduled tasks created in the correlation window",
    "Correlate system clock drift across domains",
    "Review privileged account delegation logs",
    "Alert incident response team for coordinated response",
  ],
};

function fmt(ts: number) {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 23) + " UTC";
}

function exportTemplate(alert: CorrelatedAlert) {
  const template = {
    investigation_template: {
      version: "1.0",
      generated_at: new Date().toISOString(),
      source_system: "Demo SIEM — Cross-Domain Correlation Engine",
    },
    alert: {
      id: alert.id,
      rule_id: alert.ruleId,
      type: alert.type,
      severity: alert.severity,
      confidence: `${alert.confidence}%`,
      timestamp: fmt(alert.timestamp),
      summary: alert.summary,
      involved_domains: alert.domains,
      correlated_event_ids: alert.eventIds,
    },
    mitre_attack: MITRE[alert.type] ?? [],
    recommended_actions: RECOMMENDED[alert.type] ?? [],
    investigation_fields: {
      analyst_name: "",
      priority: alert.severity,
      status: "Open",
      start_time: new Date().toISOString(),
      end_time: null,
      root_cause: "",
      affected_systems: [],
      analyst_notes: "",
      resolution_summary: "",
    },
    triage_checklist: [
      { step: "Verify alert validity and rule trigger", complete: false },
      { step: "Identify affected hosts and user accounts", complete: false },
      { step: "Confirm cross-domain scope", complete: false },
      { step: "Collect relevant log artefacts", complete: false },
      { step: "Assess potential data impact", complete: false },
      { step: "Escalate or contain per IR runbook", complete: false },
      { step: "Document findings and close", complete: false },
    ],
  };

  const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `investigation_${alert.ruleId}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AlertDetailModal({ alert, onClose }: Props) {
  const sev = SEV[alert.severity];
  const mitre = MITRE[alert.type] ?? [];
  const recs = RECOMMENDED[alert.type] ?? [];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Side panel */}
      <div
        className="h-full overflow-y-auto flex flex-col"
        style={{ width: "520px", background: "#14161a", borderLeft: "1px solid #2d3035" }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 border-b border-[#2d3035] flex-shrink-0"
          style={{ background: "#1a1c20" }}
        >
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-sm font-mono"
                style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
              >
                {alert.severity}
              </span>
              <span className="text-xs font-mono text-[#a78bfa]">{alert.ruleId}</span>
              <span className="text-xs text-[#555a62] font-mono">{TYPE_LABEL[alert.type]}</span>
            </div>
            <div className="text-sm font-semibold text-[#c8d0d8] leading-snug">{alert.summary}</div>
            <div className="text-xs text-[#555a62] font-mono">{fmt(alert.timestamp)}</div>
          </div>
          <button
            onClick={onClose}
            className="text-[#555a62] hover:text-[#c8d0d8] text-lg flex-shrink-0 ml-4 leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-4 flex-1">

          {/* Domains */}
          <Section title="Involved Domains">
            <div className="flex gap-2 flex-wrap">
              {alert.domains.map((d) => (
                <span
                  key={d}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold font-mono"
                  style={{ color: DOMAIN_COLOR[d], background: `${DOMAIN_COLOR[d]}18`, border: `1px solid ${DOMAIN_COLOR[d]}40` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: DOMAIN_COLOR[d] }} />
                  Domain {d}
                </span>
              ))}
            </div>
          </Section>

          {/* Confidence */}
          <Section title="Confidence Score">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#2a2d32" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${alert.confidence}%`,
                    background: alert.confidence >= 80 ? sev.color : "#f58220",
                  }}
                />
              </div>
              <span className="text-sm font-semibold font-mono" style={{ color: sev.color }}>
                {alert.confidence}%
              </span>
            </div>
          </Section>

          {/* Correlated events */}
          <Section title={`Correlated Event IDs (${alert.eventIds.length})`}>
            <div
              className="rounded-sm px-3 py-2 font-mono text-xs text-[#7a8490] leading-relaxed"
              style={{ background: "#0e1012", border: "1px solid #2a2d32", maxHeight: "96px", overflowY: "auto" }}
            >
              {alert.eventIds.join("\n")}
            </div>
          </Section>

          {/* MITRE ATT&CK */}
          {mitre.length > 0 && (
            <Section title="MITRE ATT&CK Mapping">
              <div className="flex flex-col gap-1.5">
                {mitre.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2 rounded-sm"
                    style={{ background: "#1a1c20", border: "1px solid #2a2d32" }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-[#c8d0d8] font-semibold">{m.technique}</span>
                      <span className="text-xs text-[#555a62] font-mono">{m.tactic}</span>
                    </div>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-sm flex-shrink-0"
                      style={{ background: "#1f1030", color: "#a78bfa", border: "1px solid #3a2860" }}
                    >
                      {m.id}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Recommended actions */}
          <Section title="Recommended Actions">
            <ol className="flex flex-col gap-1.5">
              {recs.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-[#8a9aaa]">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-semibold text-xs font-mono"
                    style={{ background: "#1e2226", color: "#f58220", border: "1px solid #3a3020" }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{r}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Export */}
          <div
            className="rounded-sm px-4 py-3 flex items-start gap-3"
            style={{ background: "#111315", border: "1px solid #2a2d32" }}
          >
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#c8d0d8] mb-0.5">Investigation Template</div>
              <div className="text-xs text-[#555a62] leading-relaxed">
                Exports a JSON package with alert metadata, MITRE mapping, triage checklist, and analyst fields — ready to attach to your IR workflow.
              </div>
            </div>
            <button
              onClick={() => exportTemplate(alert)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold transition-colors"
              style={{ background: "#f58220", color: "#111315" }}
            >
              ↓ Export
            </button>
          </div>

          <div className="pb-2" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-[#555a62] tracking-wider uppercase">{title}</div>
      {children}
    </div>
  );
}
