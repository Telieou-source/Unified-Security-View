import type { RawEvent } from "../types";

/* ── Public types ── */

export type ResultType = "table" | "stats" | "timechart";

export interface QueryResult {
  ok: true;
  type: ResultType;
  columns: string[];
  rows: string[][];
  count: number;
  queryMs: number;
  summary: string;
}

export interface QueryError {
  ok: false;
  error: string;
  hint?: string;
}

export type ExecResult = QueryResult | QueryError;

/* ── Time-range filter ── */

const TIME_RANGE_MS: Record<string, number> = {
  "Last 15 minutes": 15 * 60 * 1000,
  "Last 60 minutes": 60 * 60 * 1000,
  "Last 4 hours":    4 * 60 * 60 * 1000,
  "Last 24 hours":   24 * 60 * 60 * 1000,
  "Last 7 days":     7 * 24 * 60 * 60 * 1000,
  "All time":        Infinity,
};

function applyTimeFilter(events: RawEvent[], timeRange: string): RawEvent[] {
  const ms = TIME_RANGE_MS[timeRange] ?? Infinity;
  if (!isFinite(ms)) return events;
  const cutoff = Date.now() - ms;
  return events.filter((e) => e.timestamp >= cutoff);
}

/* ── Field accessor ── */

function getField(e: RawEvent, field: string): string {
  switch (field) {
    case "_time":     return fmtTime(e.timestamp);
    case "domain":    return e.domainId;
    case "eventtype": return e.type;
    case "severity":  return e.severity;
    case "host":      return e.host;
    case "srcIp":     return e.srcIp;
    case "dstIp":     return e.dstIp;
    case "userId":    return e.userId;
    case "protocol":  return e.protocol;
    case "srcPort":   return String(e.srcPort);
    case "dstPort":   return String(e.dstPort);
    case "id":        return e.id;
    default:          return "";
  }
}

function fmtTime(ts: number): string {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 19);
}

/* ── Helpers ── */

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

/* ── Query validator + executor ── */

const VALID_PIPES = new Set(["stats", "table", "eval", "where", "sort", "timechart", "correlate"]);
const VALID_SEVERITIES = new Set(["INFO", "WARN", "ERROR", "FATAL"]);
const VALID_FIELDS = new Set(["severity", "eventtype", "domain", "host", "userId", "protocol", "srcIp", "dstIp"]);

function err(error: string, hint?: string): QueryError {
  return { ok: false, error, hint };
}

export function runQuery(raw: string, events: RawEvent[], timeRange: string): ExecResult {
  const t0 = performance.now();
  const q = raw.trim();

  /* ── Validation: empty ── */
  if (!q) return err("Query is empty.", "Enter a search query or choose a preset below.");

  /* ── Validation: must begin with index= ── */
  if (!q.toLowerCase().startsWith("index=")) {
    return err(
      "Query must begin with  index=<name>",
      'Example:  index=cross_domain_siem | stats count by domain'
    );
  }

  /* ── Split on | ── */
  const parts = q.split("|").map((s) => s.trim());
  const basePart = parts[0];
  const pipes = parts.slice(1);

  /* ── Parse base ── */
  const baseTokens = basePart.match(/\S+/g) ?? [];
  if (baseTokens[0] !== "index=cross_domain_siem") {
    const name = (baseTokens[0] ?? "").split("=")[1] ?? "";
    return err(`Unknown index: "${name}"`, "Available index: cross_domain_siem");
  }

  /* ── Parse base field filters ── */
  const baseFilters: Array<(e: RawEvent) => boolean> = [];
  for (let i = 1; i < baseTokens.length; i++) {
    const tok = baseTokens[i];
    if (!tok.includes("=")) return err(`Unexpected token: "${tok}"`, "Filters must be field=value");
    const eqIdx = tok.indexOf("=");
    const field = tok.slice(0, eqIdx);
    const value = tok.slice(eqIdx + 1);
    if (!VALID_FIELDS.has(field)) {
      return err(`Unknown field: "${field}"`, `Filterable fields: ${[...VALID_FIELDS].join(", ")}`);
    }
    if (field === "severity" && !VALID_SEVERITIES.has(value)) {
      return err(`Invalid severity: "${value}"`, "Valid: INFO WARN ERROR FATAL");
    }
    if (value === "") return err(`Empty value for field: "${field}"`, `Example: ${field}=FATAL`);
    baseFilters.push((e) => getField(e, field) === value);
  }

  /* ── Validate pipe commands ── */
  for (const pipe of pipes) {
    const cmd = (pipe.match(/^\w+/) ?? [""])[0];
    if (!VALID_PIPES.has(cmd)) {
      return err(`Unknown pipe command: "${cmd}"`, `Valid commands: ${[...VALID_PIPES].join(", ")}`);
    }
  }

  /* ── Apply time filter + base filters ── */
  let filtered = applyTimeFilter(events, timeRange);
  for (const f of baseFilters) filtered = filtered.filter(f);

  /* ── No pipes → default tabular ── */
  if (pipes.length === 0) {
    const cols = ["_time", "domain", "eventtype", "severity", "host", "srcIp", "userId"];
    return tableResult(filtered, cols, t0, `${filtered.length} events matched`);
  }

  /* ── Execute pipe chain ── */
  return executePipes(pipes, filtered, t0);
}

/* ── Pipe chain executor ── */

function executePipes(pipes: string[], events: RawEvent[], t0: number): ExecResult {
  let currentEvents = events;
  let aggCols: string[] = [];
  let aggRows: string[][] = [];
  let hasAgg = false;
  let resultType: ResultType = "table";

  for (const pipe of pipes) {
    const tokens = pipe.match(/\S+/g) ?? [];
    const cmd = tokens[0] ?? "";

    /* eval: skip (just allow it syntactically) */
    if (cmd === "eval") continue;

    /* where: post-aggregation row filter */
    if (cmd === "where") {
      const expr = pipe.slice(5).trim();
      const m = expr.match(/^(\w+)\s*(>|<|>=|<=|!=|=)\s*(.+)$/);
      if (m && hasAgg) {
        const [, field, op, valStr] = m;
        const colIdx = aggCols.indexOf(field);
        const val = Number(valStr);
        if (colIdx >= 0 && !isNaN(val)) {
          aggRows = aggRows.filter((row) => {
            const rv = Number(row[colIdx]);
            if (op === ">")  return rv >  val;
            if (op === "<")  return rv <  val;
            if (op === ">=") return rv >= val;
            if (op === "<=") return rv <= val;
            if (op === "!=") return rv !== val;
            return rv === val;
          });
        }
      }
      continue;
    }

    /* sort */
    if (cmd === "sort") {
      const spec = tokens[1] ?? "";
      const desc = spec.startsWith("-");
      const field = desc ? spec.slice(1) : spec;
      if (hasAgg) {
        const ci = aggCols.indexOf(field);
        if (ci >= 0) {
          aggRows.sort((a, b) => {
            const av = isNaN(Number(a[ci])) ? a[ci] : Number(a[ci]);
            const bv = isNaN(Number(b[ci])) ? b[ci] : Number(b[ci]);
            return desc ? (av < bv ? 1 : av > bv ? -1 : 0) : av < bv ? -1 : av > bv ? 1 : 0;
          });
        }
      } else {
        const fieldFn = (e: RawEvent): string | number =>
          field === "_time" ? e.timestamp : getField(e, field);
        currentEvents = [...currentEvents].sort((a, b) => {
          const av = fieldFn(a), bv = fieldFn(b);
          return desc ? (av < bv ? 1 : av > bv ? -1 : 0) : av < bv ? -1 : av > bv ? 1 : 0;
        });
      }
      continue;
    }

    /* table */
    if (cmd === "table") {
      const fields = tokens.slice(1);
      if (fields.length === 0) return err("| table requires at least one field name");
      aggCols = fields;
      aggRows = currentEvents.slice(0, 200).map((e) => fields.map((f) => getField(e, f)));
      hasAgg = false;
      resultType = "table";
      continue;
    }

    /* stats */
    if (cmd === "stats") {
      const body = pipe.replace(/^stats\s+/, "");

      /* count by field [field...] */
      const countBy = body.match(/^count\s+by\s+(.+)$/);
      if (countBy) {
        const gFields = countBy[1].trim().split(/\s+/);
        const grouped = groupBy(currentEvents, (e) => gFields.map((f) => getField(e, f)).join("\0"));
        aggCols = [...gFields, "count"];
        aggRows = Object.entries(grouped)
          .map(([k, es]) => [...k.split("\0"), String(es.length)])
          .sort((a, b) => Number(b[b.length - 1]) - Number(a[a.length - 1]));
        hasAgg = true;
        resultType = "stats";
        continue;
      }

      /* dc(field) as alias by groupField */
      const dcBy = body.match(/^dc\((\w+)\)\s+as\s+(\w+)\s+by\s+(\w+)$/);
      if (dcBy) {
        const [, dcF, alias, gF] = dcBy;
        const grouped = groupBy(currentEvents, (e) => getField(e, gF));
        aggCols = [gF, alias];
        aggRows = Object.entries(grouped)
          .map(([k, es]) => [k, String(new Set(es.map((e) => getField(e, dcF))).size)])
          .sort((a, b) => Number(b[1]) - Number(a[1]));
        hasAgg = true;
        resultType = "stats";
        continue;
      }

      /* latest(_time) as alias by groupField */
      const latestBy = body.match(/^latest\(_time\)\s+as\s+(\w+)\s+by\s+(\w+)$/);
      if (latestBy) {
        const [, alias, gF] = latestBy;
        const grouped = groupBy(currentEvents, (e) => getField(e, gF));
        aggCols = [gF, alias];
        aggRows = Object.entries(grouped).map(([k, es]) => [
          k,
          fmtTime(Math.max(...es.map((e) => e.timestamp))),
        ]);
        hasAgg = true;
        resultType = "stats";
        continue;
      }

      return err(
        `Unsupported stats expression: "${body}"`,
        "Supported: count by field | dc(field) as alias by field | latest(_time) as alias by field"
      );
    }

    /* timechart */
    if (cmd === "timechart") {
      const tc = pipe.match(/timechart\s+count\s+by\s+(\w+)/);
      if (!tc) return err("timechart syntax: timechart count by <field>");
      const gF = tc[1];
      const buckets: Record<string, Record<string, number>> = {};
      const groups = new Set<string>();
      currentEvents.forEach((e) => {
        const minKey = new Date(Math.floor(e.timestamp / 60000) * 60000)
          .toISOString()
          .slice(11, 16);
        const grp = getField(e, gF);
        groups.add(grp);
        (buckets[minKey] ??= {})[grp] = ((buckets[minKey] ??= {})[grp] ?? 0) + 1;
      });
      const grpArr = [...groups].sort();
      aggCols = ["_time", ...grpArr];
      aggRows = Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-20)
        .map(([t, counts]) => [t, ...grpArr.map((g) => String(counts[g] ?? 0))]);
      hasAgg = true;
      resultType = "timechart";
      continue;
    }

    /* correlate (decorative summary) */
    if (cmd === "correlate") {
      aggCols = ["metric", "value"];
      aggRows = [
        ["Events in window", String(currentEvents.length)],
        ["Unique source IPs", String(new Set(currentEvents.map((e) => e.srcIp)).size)],
        ["Unique user IDs", String(new Set(currentEvents.map((e) => e.userId)).size)],
        ["Domains active", String(new Set(currentEvents.map((e) => e.domainId)).size)],
        ["Correlation window", "10s"],
        ["Min domains threshold", "2"],
      ];
      hasAgg = true;
      resultType = "stats";
      continue;
    }
  }

  const elapsed = Math.round(performance.now() - t0 + Math.random() * 12 + 3);
  const rows = (hasAgg ? aggRows : currentEvents.slice(0, 200).map((e) =>
    ["_time", "domain", "eventtype", "severity", "host", "srcIp", "userId"].map((f) => getField(e, f))
  )).slice(0, 200);
  const cols = hasAgg
    ? aggCols
    : ["_time", "domain", "eventtype", "severity", "host", "srcIp", "userId"];

  return {
    ok: true,
    type: resultType,
    columns: cols,
    rows,
    count: rows.length,
    queryMs: elapsed,
    summary: hasAgg
      ? `${rows.length} result${rows.length !== 1 ? "s" : ""}`
      : `${currentEvents.length} event${currentEvents.length !== 1 ? "s" : ""} matched`,
  };
}

function tableResult(events: RawEvent[], cols: string[], t0: number, summary: string): QueryResult {
  return {
    ok: true,
    type: "table",
    columns: cols,
    rows: events.slice(0, 200).map((e) => cols.map((f) => getField(e, f))),
    count: events.length,
    queryMs: Math.round(performance.now() - t0 + Math.random() * 10 + 3),
    summary,
  };
}
