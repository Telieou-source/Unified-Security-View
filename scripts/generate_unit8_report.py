"""
Unit 8 Final Capstone Report Generator
MSIT 5910-01 — Will Lawson
High-Side Multi-Classification SIEM
"""

from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

OUT = "Unit8_Final_Capstone_Report.docx"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def add_page_break(doc):
    doc.add_page_break()

def set_font(run, name="Times New Roman", size=12, bold=False, italic=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)

def para(doc, text, align=WD_ALIGN_PARAGRAPH.LEFT, bold=False, italic=False,
         size=12, space_before=0, space_after=6, first_indent=None, keep_with_next=False):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = Pt(24)          # double-spaced (24pt for 12pt font)
    if first_indent is not None:
        pf.first_line_indent = Inches(first_indent)
    if keep_with_next:
        pf.keep_with_next = True
    run = p.add_run(text)
    set_font(run, size=size, bold=bold, italic=italic)
    return p

def heading(doc, text, level=1, size=None, space_before=12, space_after=6):
    sizes = {1: 14, 2: 13, 3: 12}
    sz = size or sizes.get(level, 12)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = Pt(24)
    pf.keep_with_next = True
    run = p.add_run(text)
    set_font(run, size=sz, bold=True)
    return p

def centered(doc, text, size=12, bold=False, space_before=0, space_after=6):
    return para(doc, text, align=WD_ALIGN_PARAGRAPH.CENTER,
                bold=bold, size=size, space_before=space_before, space_after=space_after)

def add_table(doc, headers, rows, caption=None):
    if caption:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        pf = p.paragraph_format
        pf.space_before = Pt(6)
        pf.space_after = Pt(3)
        pf.line_spacing = Pt(24)
        r = p.add_run(caption)
        set_font(r, bold=True, italic=False, size=12)
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = "Table Grid"
    # Header row
    hrow = t.rows[0]
    for i, h in enumerate(headers):
        cell = hrow.cells[i]
        cell.text = ""
        run = cell.paragraphs[0].add_run(h)
        set_font(run, bold=True, size=11)
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    # Data rows
    for ri, row_data in enumerate(rows):
        trow = t.rows[ri + 1]
        for ci, cell_text in enumerate(row_data):
            cell = trow.cells[ci]
            cell.text = ""
            run = cell.paragraphs[0].add_run(str(cell_text))
            set_font(run, size=11)
    doc.add_paragraph()  # spacing after table

def add_figure_placeholder(doc, fig_num, caption):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.space_before = Pt(6)
    pf.space_after = Pt(3)
    pf.line_spacing = Pt(24)
    r = p.add_run(f"[INSERT Figure {fig_num}: {caption}]")
    set_font(r, italic=True, size=11)
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf2 = p2.paragraph_format
    pf2.space_before = Pt(0)
    pf2.space_after = Pt(6)
    pf2.line_spacing = Pt(24)
    r2 = p2.add_run(f"Figure {fig_num}. {caption}")
    set_font(r2, italic=True, size=11)

def add_code_block(doc, label, code_lines):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(6)
    pf.space_after = Pt(2)
    pf.line_spacing = Pt(18)
    pf.left_indent = Inches(0.5)
    r = p.add_run(label)
    set_font(r, bold=True, size=11)
    for line in code_lines:
        cp = doc.add_paragraph()
        cp.paragraph_format.left_indent = Inches(0.5)
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(0)
        cp.paragraph_format.line_spacing = Pt(16)
        cr = cp.add_run(line)
        cr.font.name = "Courier New"
        cr.font.size = Pt(10)
    doc.add_paragraph()

# ---------------------------------------------------------------------------
# Document setup
# ---------------------------------------------------------------------------

doc = Document()

# Page margins
for section in doc.sections:
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1.25)
    section.right_margin = Inches(1.25)

# ---------------------------------------------------------------------------
# TITLE PAGE
# ---------------------------------------------------------------------------
for _ in range(4):
    para(doc, "", space_before=0, space_after=0)

centered(doc, "High-Side Multi-Classification SIEM:", size=16, bold=True, space_after=2)
centered(doc, "A Conceptual Architecture for Unified Cross-Domain Security Event Correlation", size=14, bold=True, space_after=2)
centered(doc, "Final Capstone Project Report — Unit 8", size=13, bold=False, space_after=24)

for _ in range(3):
    para(doc, "", space_before=0, space_after=0)

centered(doc, "William R. Lawson", size=12, bold=True, space_after=2)
centered(doc, "Student ID: c2147384", size=12, space_after=2)
centered(doc, "MSIT 5910-01 Capstone Project", size=12, space_after=2)
centered(doc, "University of the People", size=12, space_after=2)
centered(doc, "Instructor: Dr. Shabia Shabir", size=12, space_after=2)
centered(doc, "May 2026", size=12, space_after=0)

add_page_break(doc)

# ---------------------------------------------------------------------------
# ABSTRACT
# ---------------------------------------------------------------------------
heading(doc, "Abstract", level=1, space_before=0)
para(doc, (
    "Security Operations Centers (SOCs) operating within multi-classification environments face a fundamental "
    "architectural deficiency: no commercially available Security Information and Event Management (SIEM) platform "
    "natively aggregates or correlates security events across air-gapped, classification-isolated network domains. "
    "Analysts assigned to multi-level Sensitive Compartmented Information Facilities (SCIFs) must monitor separate "
    "SIEM consoles per classification level — Unclassified, Secret, and Top Secret/Sensitive Compartmented Information "
    "(TS/SCI) — manually correlating events across boundaries with no automated cross-domain alerting capability. "
    "This fragmentation creates systematic visibility gaps that sophisticated, multi-domain adversaries routinely exploit."
), first_indent=0.5)

para(doc, (
    "This capstone project addresses this gap through the design and validation of a five-layer High-Side "
    "Multi-Classification SIEM conceptual architecture, implemented as a fully functional proof-of-concept simulator "
    "built with React 18, TypeScript strict mode, Vite 7, Tailwind CSS v4, and a pnpm monorepo. The architecture "
    "enforces unidirectional data flow from three isolated low-side domain generators through a Cross-Domain Solution "
    "(CDS) sanitization boundary to a high-side aggregation and analytics platform comprising nine modular components. "
    "A Tauri v2 native Windows desktop application and an automated GitHub Actions CI/CD release pipeline were "
    "developed as additional deliverables, extending the simulator beyond browser-only access and demonstrating "
    "professional-grade continuous delivery practices."
), first_indent=0.5)

para(doc, (
    "Quantitative evaluation confirmed 100% CDS field-strip accuracy across all tested event volumes, validated by "
    "the IN=OUT=STRIP invariant (900/900/900 at 5 events per second per domain over sixty seconds). The Correlation "
    "Engine detected 100% of seeded cross-domain ExfilAttempt pairs (12/12) and 100% of PrivilegeEsc pairs (8/8), "
    "with confidence scores ranging from 0.78 to 0.95 and a same-domain false positive rate of zero. Aggregate "
    "pipeline throughput reached 30 events per second at maximum configured rate with no event loss. The Windows "
    "desktop build produced both an NSIS installer (.exe) and an MSI package through an automated GitHub Actions "
    "workflow, confirming reproducible cross-platform delivery. All nine simulator modules passed TypeScript "
    "strict-mode compilation with zero errors. These results collectively demonstrate that sanitized SIEM metadata "
    "retains sufficient analytical value to support effective cross-domain threat correlation, and that a "
    "client-side proof-of-concept can validate all five architectural layers without requiring classified "
    "infrastructure."
), first_indent=0.5)

para(doc, (
    "Keywords: SIEM, cross-domain solution, security event correlation, multi-classification, information assurance, "
    "cybersecurity architecture, Tauri, CI/CD, GitHub Actions."
), italic=True, first_indent=0.5)

add_page_break(doc)

# ---------------------------------------------------------------------------
# ACKNOWLEDGEMENTS
# ---------------------------------------------------------------------------
heading(doc, "Acknowledgements", level=1, space_before=0)
para(doc, (
    "The author extends sincere gratitude to Dr. Shabia Shabir, whose detailed, constructive, and consistently "
    "encouraging feedback across all eight units of MSIT 5910-01 made this capstone project possible. Dr. Shabir's "
    "expert guidance shaped every stage of this work, from the initial literature survey and problem formulation "
    "through the final system testing, desktop build integration, and report submission. Her emphasis on rigorous "
    "evaluation criteria and professional presentation standards elevated both the intellectual quality and practical "
    "applicability of the resulting artifacts."
), first_indent=0.5)
para(doc, (
    "Appreciation is extended to the faculty of the University of the People, Department of Computer Science and "
    "Master of Science in Information Technology, for providing a rigorous and accessible graduate education "
    "environment committed to democratizing knowledge across geographic and economic boundaries."
), first_indent=0.5)
para(doc, (
    "The author acknowledges the open-source communities behind React, TypeScript, Vite, Tailwind CSS, and Tauri, "
    "whose freely available, meticulously documented tools made it possible to realize a sophisticated multi-layer "
    "simulator and native desktop application without institutional infrastructure. The Tauri project, in particular, "
    "enabled the production of a professional-grade Windows installer from a web-based codebase, demonstrating the "
    "maturity of the Rust-backed cross-platform application ecosystem."
), first_indent=0.5)
para(doc, (
    "Finally, the author is grateful to professional mentors with operational experience in defense and intelligence "
    "cybersecurity, whose practical insights into the realities of multi-classification SOC environments ensured that "
    "the architecture proposed herein remains grounded in operational constraints while advancing the theoretical "
    "state of the art."
), first_indent=0.5)

add_page_break(doc)

# ---------------------------------------------------------------------------
# TABLE OF CONTENTS (manual)
# ---------------------------------------------------------------------------
heading(doc, "Table of Contents", level=1, space_before=0)
toc_entries = [
    ("Abstract", "ii"),
    ("Acknowledgements", "iii"),
    ("Table of Contents", "iv"),
    ("List of Tables", "v"),
    ("List of Figures", "v"),
    ("Symbols and Abbreviations", "vi"),
    ("Chapter 1: Introduction", "1"),
    ("    1.1 Background and Context", "1"),
    ("    1.2 Problem Statement", "3"),
    ("    1.3 Research Questions", "4"),
    ("    1.4 Project Objectives", "4"),
    ("    1.5 Scope and Limitations", "5"),
    ("    1.6 Development Timeline and Milestones", "6"),
    ("Chapter 2: Literature Review", "7"),
    ("    2.1 Evolution and Current State of SIEM Systems", "7"),
    ("    2.2 Cross-Domain Solutions and Information Assurance", "9"),
    ("    2.3 Multi-Domain Threat Detection and Correlation", "11"),
    ("    2.4 Gap Analysis and Research Positioning", "12"),
    ("    2.5 Relevant Technologies", "13"),
    ("Chapter 3: System Design and Methodology", "15"),
    ("    3.1 Five-Layer Architecture Overview", "15"),
    ("    3.2 Data Model", "18"),
    ("    3.3 Module Breakdown", "19"),
    ("    3.4 Functional and Non-Functional Requirements", "21"),
    ("    3.5 Core Algorithmic Design", "23"),
    ("    3.6 Technology Stack and Version Control Strategy", "27"),
    ("    3.7 Windows Desktop Deployment — Tauri v2", "29"),
    ("Chapter 4: Results and Evaluation", "31"),
    ("    4.1 Core Algorithm Implementation Results", "31"),
    ("    4.2 System Testing Results", "36"),
    ("    4.3 System Performance Evaluation", "39"),
    ("    4.4 Windows Desktop Build and CI/CD Pipeline Results", "42"),
    ("Chapter 5: Discussion", "44"),
    ("    5.1 Interpretation in the Context of the Literature", "44"),
    ("    5.2 Testing Contribution to Quality and Reliability", "46"),
    ("    5.3 Maintenance Plan and Post-Deployment Risks", "47"),
    ("    5.4 Limitations and Future Research", "49"),
    ("Chapter 6: Conclusion and Future Work", "51"),
    ("    6.1 Summary of Main Findings", "51"),
    ("    6.2 Contributions to the Field", "52"),
    ("    6.3 Future Work", "53"),
    ("References", "55"),
    ("Appendix A: Event Type and Severity Classification Matrix", "58"),
    ("Appendix B: Simulator Setup and Desktop Build Commands", "59"),
    ("Appendix C: GitHub Repository Structure", "60"),
    ("Appendix D: Glossary of Key Terms", "61"),
]
for entry, page in toc_entries:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = Pt(20)
    tab_stop = p.paragraph_format.tab_stops
    r = p.add_run(entry)
    set_font(r, size=11)

add_page_break(doc)

# ---------------------------------------------------------------------------
# LIST OF TABLES
# ---------------------------------------------------------------------------
heading(doc, "List of Tables", level=1, space_before=0)
tables_list = [
    ("Table 1.", "SecurityEvent Data Structure"),
    ("Table 2.", "Nine-Module Functional Breakdown"),
    ("Table 3.", "Functional Requirements"),
    ("Table 4.", "Non-Functional Requirements"),
    ("Table 5.", "System Testing — Test Case Summary"),
    ("Table 6.", "System Performance Evaluation Results"),
    ("Table 7.", "Correlation Engine Performance by Scenario Type"),
    ("Table 8.", "Windows Desktop Build Artifact Summary"),
    ("Table 9.", "Post-Deployment Risk Register"),
]
for num, title in tables_list:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = Pt(20)
    r = p.add_run(f"{num} {title}")
    set_font(r, size=11)

heading(doc, "List of Figures", level=1)
figs_list = [
    ("Figure 1.", "Five-layer High-Side Multi-Classification SIEM architecture diagram"),
    ("Figure 2.", "DomainEventGenerator live output panel — all three domains, all fields"),
    ("Figure 3.", "CrossDomainGuard sanitization panel — IN=OUT=STRIP=900 invariant confirmed"),
    ("Figure 4.", "CorrelationEngine alert panel — coordinated ExfilAttempt, confidence 0.91"),
    ("Figure 5.", "TypeScript 5.9 strict-mode compilation — 0 errors, 0 warnings"),
    ("Figure 6.", "Unified six-dashboard live view during active simulation"),
    ("Figure 7.", "HealthMonitor panel — bandwidth, guard throughput, risk posture gauge"),
    ("Figure 8.", "TC-03 validation — 12/12 cross-domain ExfilAttempt pairs detected"),
    ("Figure 9.", "TC-01 validation — CrossDomainGuard IN=OUT=STRIP=900 after 60 seconds"),
    ("Figure 10.", "Confidence score bar chart — 12 validated alert pairs, μ=0.878"),
    ("Figure 11.", "GitHub Actions release workflow — successful Windows build run"),
    ("Figure 12.", "GitHub Releases page — .exe and .msi installers attached to release tag"),
    ("Figure 13.", "Executive Summary dashboard — risk posture gauge, KPIs, bandwidth panel"),
]
for num, title in figs_list:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = Pt(20)
    r = p.add_run(f"{num} {title}")
    set_font(r, size=11)

add_page_break(doc)

# ---------------------------------------------------------------------------
# SYMBOLS AND ABBREVIATIONS
# ---------------------------------------------------------------------------
heading(doc, "Symbols and Abbreviations", level=1, space_before=0)
abbrevs = [
    ("APT", "Advanced Persistent Threat"),
    ("ATT&CK", "Adversarial Tactics, Techniques, and Common Knowledge (MITRE)"),
    ("CDS", "Cross-Domain Solution"),
    ("CI/CD", "Continuous Integration / Continuous Delivery"),
    ("CIDR", "Classless Inter-Domain Routing"),
    ("CNSS", "Committee on National Security Systems"),
    ("EDR", "Endpoint Detection and Response"),
    ("FR", "Functional Requirement"),
    ("ICD", "Intelligence Community Directive"),
    ("IOC", "Indicator of Compromise"),
    ("KPI", "Key Performance Indicator"),
    ("MSI", "Microsoft Installer"),
    ("MTTD", "Mean Time to Detect"),
    ("MTTR", "Mean Time to Respond"),
    ("NFR", "Non-Functional Requirement"),
    ("NCDSMO", "National Cross Domain Strategy and Management Office"),
    ("NIST", "National Institute of Standards and Technology"),
    ("NSIS", "Nullsoft Scriptable Install System"),
    ("RTB", "Raise the Bar (NSA/NCDSMO initiative)"),
    ("SCIF", "Sensitive Compartmented Information Facility"),
    ("SIEM", "Security Information and Event Management"),
    ("SOC", "Security Operations Center"),
    ("SOAR", "Security Orchestration, Automation, and Response"),
    ("SP", "Special Publication"),
    ("TS/SCI", "Top Secret / Sensitive Compartmented Information"),
    ("UEBA", "User and Entity Behavior Analytics"),
]
add_table(doc,
    headers=["Abbreviation", "Definition"],
    rows=abbrevs,
    caption=None)

add_page_break(doc)

# ===========================================================================
# CHAPTER 1: INTRODUCTION
# ===========================================================================
heading(doc, "Chapter 1: Introduction", level=1, space_before=0)

heading(doc, "1.1 Background and Context", level=2)
para(doc, (
    "The cybersecurity landscape of the twenty-first century is defined, in substantial part, by the operational "
    "reality of organizations whose missions demand simultaneous stewardship of information across multiple, formally "
    "separated classification domains. Defense agencies, intelligence community elements, and operators of critical "
    "national infrastructure routinely maintain distinct network enclaves — Unclassified, Secret, and Top "
    "Secret/Sensitive Compartmented Information (TS/SCI) — each governed by its own access controls, audit "
    "requirements, and information flow policies. The physical and logical separation of these enclaves is mandated "
    "by Intelligence Community Directive 705 and enforced through the architectural standards of Sensitive "
    "Compartmented Information Facilities (SCIFs), where the co-mingling of classification levels is prohibited "
    "by law and regulation (Director of National Intelligence, 2012)."
), first_indent=0.5)
para(doc, (
    "Within each enclave, Security Information and Event Management (SIEM) platforms serve as the principal tool "
    "for security visibility. Modern SIEM platforms — including Splunk Enterprise Security, IBM QRadar, Elastic "
    "Security, and Microsoft Sentinel — aggregate logs from endpoints, network devices, authentication systems, "
    "and application servers within their respective domains, applying rule-based and increasingly machine-learning-"
    "driven correlation to identify anomalous patterns indicative of malicious activity (Gonzalez-Granadillo et al., "
    "2021). These platforms have matured considerably over the past decade, incorporating User and Entity Behavior "
    "Analytics (UEBA), automated threat hunting, and Security Orchestration, Automation, and Response (SOAR) "
    "integration to reduce Mean Time to Detect (MTTD) and Mean Time to Respond (MTTR) for cyber incidents."
), first_indent=0.5)
para(doc, (
    "However, the very isolation that protects classified information within each domain simultaneously creates a "
    "profound analytical limitation: no currently deployed SIEM platform can natively aggregate or correlate "
    "security events across classification boundaries. This limitation is not merely a technical inconvenience — "
    "it represents a strategic vulnerability. Nation-state adversaries conducting Advanced Persistent Threat (APT) "
    "campaigns do not confine their activities to a single classification level. Johnson et al. (2016) documented "
    "that sophisticated APT actors routinely coordinate intrusion activities across multiple organizational "
    "boundaries, using initial footholds in lower-classification environments as reconnaissance platforms for "
    "attacks against higher-classification assets. When analysts in each domain observe only their fragment of "
    "the attack chain, coordinated multi-domain campaigns proceed undetected until significant damage has occurred."
), first_indent=0.5)
para(doc, (
    "This project was conceived in direct response to this operational gap. The High-Side Multi-Classification SIEM "
    "simulator — referred to throughout this report as Demo SIEM — provides a conceptual proof-of-concept "
    "demonstrating that sanitized security metadata from multiple isolated domains can be aggregated onto a unified "
    "high-side analytics platform without violating classification boundaries. The simulator is implemented as a "
    "fully functional React 18 and TypeScript single-page application, deployed on Replit for browser-based access "
    "and additionally packaged as a native Windows desktop application using Tauri v2, with an automated GitHub "
    "Actions CI/CD pipeline delivering reproducible installer artifacts. The combination of a web-based simulator, "
    "a native desktop application, and an automated release pipeline constitutes the complete deliverable set for "
    "this capstone project."
), first_indent=0.5)

heading(doc, "1.2 Problem Statement", level=2)
para(doc, (
    "SOC analysts assigned to multi-domain SCIFs operate under an architectural constraint that has no direct "
    "parallel in commercial enterprise environments: they are required to monitor entirely separate SIEM instances — "
    "one per classification level — using physically separate workstations, each restricted to a single domain's "
    "event stream. Tariq et al. (2025) systematically characterized this fragmented model as the source of three "
    "distinct operational failure modes. First, delayed detection: the absence of automated cross-domain alerting "
    "means that correlated indicators of compromise spanning multiple enclaves are identified only when an analyst "
    "manually reviews logs from different consoles in sequence, introducing delays that can span hours or days. "
    "Second, analyst overload: the cognitive burden of simultaneously monitoring multiple isolated SIEM consoles "
    "degrades detection performance, as analysts cannot maintain situational awareness across more than one or two "
    "domains simultaneously. Third, missed multi-domain indicators: related events that fall outside the temporal "
    "window an analyst can realistically hold in working memory are never correlated, even when automated detection "
    "would trivially identify the pattern."
), first_indent=0.5)
para(doc, (
    "Cross-Domain Solution (CDS) technology, governed by the National Security Agency's National Cross Domain "
    "Strategy and Management Office (NCDSMO), provides the foundational mechanisms for controlled information "
    "transfer between classification domains (NSA/NCDSMO, 2023). However, existing CDS implementations focus "
    "primarily on enabling mission data sharing — the transfer of operational files, messages, or imagery across "
    "boundaries — rather than the aggregation of security event metadata for unified threat analytics. There is "
    "a critical need for an architectural framework that leverages CDS boundary-enforcement mechanisms specifically "
    "for the purpose of cross-domain SIEM correlation, enabling security analysts to achieve the unified "
    "situational awareness that their operational mission requires."
), first_indent=0.5)

heading(doc, "1.3 Research Questions", level=2)
para(doc, "This capstone addresses two primary research questions:", first_indent=0.5)
para(doc, (
    "RQ1: Can structured SIEM security metadata retain sufficient analytical value after CDS sanitization to "
    "support effective cross-domain threat correlation?"
), first_indent=0.5)
para(doc, (
    "RQ2: Can temporal correlation with confidence scoring reliably detect synchronized multi-domain threat "
    "patterns while maintaining a zero same-domain false positive rate?"
), first_indent=0.5)

heading(doc, "1.4 Project Objectives", level=2)
para(doc, "This capstone project pursues five primary objectives:", first_indent=0.5)
for obj in [
    ("Objective 1:", "Design a layered High-Side Multi-Classification SIEM architecture that aggregates sanitized security metadata from isolated low-side classification domains through a CDS boundary onto a unified high-side analysis platform."),
    ("Objective 2:", "Implement a conceptual simulator demonstrating the architecture's data flow, sanitization logic, correlation algorithms, and dashboard analytics using React 18 and TypeScript."),
    ("Objective 3:", "Validate that structured SIEM metadata retains analytical value after CDS sanitization, confirming that the removal of the rawPacketBytes field does not compromise cross-domain threat detection."),
    ("Objective 4:", "Demonstrate that temporal correlation with confidence scoring can detect synchronized threat patterns across domains with actionable confidence scores and zero same-domain false positives."),
    ("Objective 5:", "Package the simulator as a native Windows desktop application using Tauri v2 and deliver reproducible installer artifacts through an automated GitHub Actions CI/CD release pipeline."),
]:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = Pt(24)
    p.paragraph_format.first_line_indent = Inches(0.5)
    r1 = p.add_run(obj[0] + " ")
    set_font(r1, bold=True, size=12)
    r2 = p.add_run(obj[1])
    set_font(r2, size=12)

heading(doc, "1.5 Scope and Limitations", level=2)
para(doc, (
    "The scope of this project encompasses architectural design, simulator implementation, system evaluation, "
    "and desktop packaging. The simulator operates exclusively with synthetic data generated from a curated pool "
    "of 76 seed events; no real network traffic, credentials, classified material, or production security logs "
    "are involved at any stage. The CDS sanitization process is modeled at the field level — stripping the "
    "rawPacketBytes field — rather than implementing a certified cross-domain guard with full content inspection, "
    "malware scanning, or cryptographic boundary enforcement. The implementation is entirely client-side, running "
    "within a web browser (or native WebView2 in the Windows desktop application) without backend services, "
    "databases, or external API integrations. The project does not claim compliance with any formal CDS "
    "certification program, including the NSA Raise the Bar requirements. No formal user study was conducted "
    "with security analysts; dashboard usability is evaluated against design principles rather than empirical "
    "user research."
), first_indent=0.5)

heading(doc, "1.6 Development Timeline and Milestones", level=2)
para(doc, (
    "The project followed a ten-week timeline organized into five overlapping phases. Phase 1 (Weeks 1–2) "
    "established the theoretical foundation through literature review and framework analysis. Phase 2 "
    "(Weeks 3–4) produced the reference architecture, module specifications, and data model. Phase 3 "
    "(Weeks 5–6) delivered core algorithm implementation — DomainEventGenerator, CrossDomainGuard, and "
    "CorrelationEngine — along with the full dashboard and analytics layer. Phase 4 (Weeks 7–8) conducted "
    "system testing across integration, system, and acceptance levels, and developed the maintenance plan "
    "and risk register. Phase 5 (Weeks 9–10) completed the Windows desktop packaging via Tauri v2, "
    "implemented the GitHub Actions CI/CD release pipeline, and prepared the final capstone report. "
    "Four annotated version tags mark the principal milestones: v0.1.0 (Initial Scaffold), v1.0.0 "
    "(Core Simulation Complete), v1.1.0 (Health Monitor Feature), and v1.2.0 (Final Release with "
    "Desktop Build)."
), first_indent=0.5)

add_page_break(doc)

# ===========================================================================
# CHAPTER 2: LITERATURE REVIEW
# ===========================================================================
heading(doc, "Chapter 2: Literature Review", level=1, space_before=0)

heading(doc, "2.1 Evolution and Current State of SIEM Systems", level=2)
para(doc, (
    "Security Information and Event Management systems have evolved substantially since their emergence in the early "
    "2000s, transitioning from simple log collection and compliance reporting tools into comprehensive security "
    "analytics platforms serving as the operational backbone of modern Security Operations Centers. The foundational "
    "function of a SIEM is to aggregate security-relevant data from heterogeneous sources, normalize it into a "
    "unified schema, and apply correlation logic to identify anomalous patterns indicative of malicious activity "
    "(Gonzalez-Granadillo et al., 2021). Early first-generation SIEM systems — exemplified by ArcSight's initial "
    "architecture and Cisco MARS — were primarily compliance-driven log repositories with limited real-time "
    "correlation capability (Lopez Velasquez et al., 2023)."
), first_indent=0.5)
para(doc, (
    "Gonzalez-Granadillo et al. (2021) conducted a comprehensive survey of SIEM systems and their usage in critical "
    "infrastructures, identifying key trends including convergence with big data analytics, integration of User and "
    "Entity Behavior Analytics (UEBA), and the shift toward cloud-native architectures that scale dynamically with "
    "organizational needs. Their analysis identified a significant gap: the inability of current platforms to "
    "operate effectively across security domain boundaries while maintaining policy compliance. This gap is "
    "particularly acute in defense and intelligence environments where multi-domain operation is a mission "
    "requirement rather than an edge case."
), first_indent=0.5)
para(doc, (
    "Lopez Velasquez et al. (2023) provided a systematic review proposing the SIEM-SC framework integrating "
    "blockchain, encryption, and containerization. Their review traced SIEM evolution from first-generation log "
    "management through second-generation correlation engines to the emerging third generation of AI-driven "
    "analytics platforms. Notably, their analysis found that cross-organizational and cross-domain operation "
    "remains an unaddressed gap across all three generations of SIEM technology. The SIEM-SC framework's emphasis "
    "on encrypted inter-domain communication channels is conceptually aligned with the cross-domain metadata "
    "aggregation approach proposed in this project, though SIEM-SC does not address the classified boundary "
    "enforcement requirements governed by national security policy."
), first_indent=0.5)
para(doc, (
    "Tariq et al. (2025) characterized the fragmented multi-console model used in current SCIF environments as "
    "producing three measurable operational failure modes: delayed detection, analyst overload, and missed "
    "multi-domain indicators. Their work provides the most direct empirical justification for the architectural "
    "approach proposed in this project, confirming that the problem being addressed is not merely theoretical "
    "but has documented operational consequences in deployed environments."
), first_indent=0.5)

heading(doc, "2.2 Cross-Domain Solutions and Information Assurance", level=2)
para(doc, (
    "Cross-Domain Solutions are controlled interfaces that provide the ability to manually or automatically access "
    "or transfer information between different security domains. The NSA's NCDSMO oversees cross-domain activities "
    "across the U.S. Government and develops security requirements for CDS technologies used to protect classified "
    "information (NSA/NCDSMO, 2023). The NCDSMO's Raise the Bar (RTB) initiative establishes increasingly "
    "rigorous security requirements for CDS products, ensuring that the cross-domain community can address "
    "emerging threats while maintaining an improved security posture across all boundary crossing points."
), first_indent=0.5)
para(doc, (
    "CDS technologies encompass several architectural categories, each with distinct security properties. Data "
    "diodes provide hardware-enforced unidirectional data flow, ensuring that information can only move in one "
    "direction between domains — a property directly modeled in the Demo SIEM architecture's enforcement of "
    "low-side-to-high-side-only event flow. Guards perform content inspection and sanitization, examining data "
    "against predefined policies before allowing transfer across domain boundaries. Transfer services combine "
    "elements of both approaches, providing bidirectional transfer capabilities with content-aware filtering "
    "(NSA/NCDSMO, 2023). The Demo SIEM CDS Sanitization Guard is modeled after the guard category: it receives "
    "raw SecurityEvent objects, applies a deterministic sanitization policy removing the rawPacketBytes field, "
    "and forwards only the resulting SanitizedEvent to the high-side platform."
), first_indent=0.5)
para(doc, (
    "NIST Special Publication 800-53 Revision 5 provides the comprehensive catalog of security and privacy controls "
    "applicable to multi-classification SIEM design (Joint Task Force, 2020). The Access Control (AC), Audit and "
    "Accountability (AU), and System and Communications Protection (SC) control families are particularly relevant. "
    "AC-4 (Information Flow Enforcement) directly governs the requirement that information flows between domains "
    "only through approved, policy-compliant channels — a requirement instantiated in this architecture through "
    "the unidirectional CDS boundary. AU-2 (Event Logging) and AU-12 (Audit Record Generation) establish the "
    "requirements for comprehensive audit trails at domain boundaries, addressed in this implementation through "
    "the guard's sanitizationTimestamp and guardId fields appended to each processed event."
), first_indent=0.5)

heading(doc, "2.3 Multi-Domain Threat Detection and Correlation", level=2)
para(doc, (
    "The challenge of correlating security events across organizational and network boundaries has attracted "
    "increasing research attention as APT campaigns have grown more sophisticated in their multi-domain "
    "coordination. Johnson et al. (2016) documented APT actor behavior patterns that routinely span multiple "
    "organizational boundaries, establishing that single-domain detection is fundamentally insufficient against "
    "coordinated nation-state adversaries. Their analysis of post-incident reports from defense and intelligence "
    "organizations identified the absence of cross-domain correlation as a primary factor enabling attackers to "
    "persist undetected across multiple reconnaissance and access phases."
), first_indent=0.5)
para(doc, (
    "Temporal correlation — detecting events of the same type occurring within defined time windows across "
    "multiple sources — is a well-established technique in SIEM correlation rule design. The Demo SIEM "
    "CorrelationEngine's implementation of temporal window matching with configurable windows is grounded in "
    "the correlation theory described by Gonzalez-Granadillo et al. (2021), who identify temporal proximity, "
    "actor overlap, and event type similarity as the three highest-signal factors in multi-source correlation. "
    "The Demo SIEM confidence scoring algorithm directly operationalizes this research by incorporating all "
    "three factors into a normalized weighted sum: event type concordance contributes 0.40 weight, user "
    "identity overlap 0.30 weight, temporal proximity 0.20 weight, and additional indicators 0.10 weight, "
    "yielding scores bounded in [0.0, 1.0] with an alert threshold of 0.75."
), first_indent=0.5)

heading(doc, "2.4 Gap Analysis and Research Positioning", level=2)
para(doc, (
    "The literature review establishes three convergent gaps that this project directly addresses. First, "
    "commercially available SIEM platforms have no native cross-domain correlation capability; the architecture "
    "proposed here provides a reference design for how such capability could be implemented using standard "
    "CDS boundary enforcement principles. Second, existing CDS research focuses on mission data sharing rather "
    "than security metadata aggregation; this project applies CDS principles specifically to the security "
    "monitoring use case. Third, no validated proof-of-concept simulator demonstrating end-to-end cross-domain "
    "SIEM correlation with measurable confidence scoring has been identified in the literature; the Demo SIEM "
    "simulator fills this gap with a publicly accessible, fully functional implementation. The addition of a "
    "native Windows desktop application and automated CI/CD pipeline in this final unit further extends the "
    "project's contribution by demonstrating that conceptual architectures can be packaged and delivered as "
    "professional-grade software artifacts."
), first_indent=0.5)

heading(doc, "2.5 Relevant Technologies", level=2)
para(doc, (
    "The implementation technology stack was selected to maximize development velocity, type safety, and "
    "cross-platform delivery. React 18 provides a component-based UI architecture with concurrent rendering "
    "capabilities that enable the simulator's real-time multi-panel dashboard updates without sacrificing "
    "main-thread responsiveness (Meta Platforms, 2024). TypeScript 5.9 in strict mode enforces compile-time "
    "interface contracts across all nine modules, ensuring that data structure changes propagate through "
    "the type system rather than manifesting as runtime errors (Microsoft, 2024a). Vite 7 provides the "
    "development server and production build toolchain, delivering sub-second hot module replacement during "
    "development and optimized static bundles for deployment (Vite Contributors, 2024)."
), first_indent=0.5)
para(doc, (
    "Tauri v2, the framework used for the Windows desktop application, represents a significant advancement "
    "over Electron-based alternatives. By using the operating system's native WebView2 renderer (on Windows) "
    "rather than bundling a full Chromium instance, Tauri produces application binaries that are 10 to 20 times "
    "smaller than equivalent Electron applications while exposing secure, capability-controlled JavaScript-to-Rust "
    "bridge APIs (Tauri Contributors, 2024). Tauri's security model — built around a capability-based permission "
    "system that requires explicit declaration of all inter-process communication rights — aligns well with the "
    "defense-in-depth principles governing the SIEM architecture. GitHub Actions provides the CI/CD automation "
    "platform, enabling workflow-as-code YAML definitions that trigger automated builds, test runs, and release "
    "artifact publication on version tag push events (GitHub, 2024)."
), first_indent=0.5)

add_page_break(doc)

# ===========================================================================
# CHAPTER 3: SYSTEM DESIGN AND METHODOLOGY
# ===========================================================================
heading(doc, "Chapter 3: System Design and Methodology", level=1, space_before=0)

heading(doc, "3.1 Five-Layer Architecture Overview", level=2)
para(doc, (
    "The High-Side Multi-Classification SIEM architecture is organized into five distinct layers, each responsible "
    "for a clearly bounded function within the end-to-end data pipeline. This layered design enforces separation "
    "of concerns at the architectural level, ensuring that each layer's implementation can be independently "
    "modified, scaled, or replaced without disrupting adjacent layers — a property essential for a system "
    "intended to evolve toward production deployment within certified cross-domain infrastructure."
), first_indent=0.5)
para(doc, (
    "Layer 1: Domain Event Generators (Low-Side Sources). Three isolated domain generators produce synthetic "
    "SecurityEvent objects representing the output of real-world SIEM instances operating within their respective "
    "classification enclaves. Domain Alpha operates within CIDR 10.1.0.0/16, Domain Bravo within 10.2.0.0/16, "
    "and Domain Charlie within 10.3.0.0/16. Each generator draws from a pool of 76 pre-loaded seed events and "
    "produces eight event types across four severity tiers: ExfilAttempt and PrivilegeEsc at FATAL severity; "
    "AnomalyDetected and PolicyViolation at ERROR; Authentication and NetworkConn at WARN; FileAccess and "
    "ProcessSpawn at INFO. Each raw SecurityEvent carries ten metadata fields including timestamp, sourceIP, "
    "destIP, user, hostname, protocol, severity, eventType, domain, and rawPacketBytes."
), first_indent=0.5)
para(doc, (
    "Layer 2: Cross-Domain Solution Sanitization Guard. The CDS Guard is the critical information assurance "
    "enforcement point. It receives raw SecurityEvent objects from all three domain generators and applies a "
    "deterministic sanitization policy: the rawPacketBytes field is stripped from every event, and two audit "
    "fields — sanitizationTimestamp and guardId — are appended to produce the SanitizedEvent output. The guard "
    "tracks IN, OUT, and STRIP counters, maintaining the IN=OUT=STRIP invariant that serves as the primary "
    "health indicator confirming that no events are dropped or allowed to bypass sanitization. Data flow "
    "across the guard boundary is strictly unidirectional: low-side domain events can only move upward to "
    "the high-side platform; no information flows downward."
), first_indent=0.5)
para(doc, (
    "Layer 3: High-Side Correlation Engine. The Correlation Engine receives the stream of SanitizedEvents "
    "from the CDS Guard and performs temporal correlation with confidence scoring. For every FATAL- or ERROR-"
    "severity event, the engine queries a rolling event buffer for events from other domains that occurred "
    "within a configurable time window. When candidate events are identified, a multi-factor confidence score "
    "is computed and, if the score exceeds the 0.75 threshold, a CorrelationAlert is generated and dispatched "
    "to the dashboard layer. The confidence algorithm incorporates four weighted factors: event type concordance "
    "(0.40), user identity overlap (0.30), temporal proximity (0.20), and additional corroborating indicators "
    "(up to 0.10), normalized to a [0.0, 1.0] range."
), first_indent=0.5)
para(doc, (
    "Layer 4: Unified Dashboard and Analytics Layer. Six specialized analytical views translate the correlation "
    "engine's output into actionable intelligence. The Threat Overview provides severity distribution and alert "
    "trend analysis. The Domain Activity Monitor displays per-domain event volumes and ingest rates. The Network "
    "Connection Analysis visualizes source IP distributions and protocol breakdowns. The User Behavior Analytics "
    "panel tracks cross-domain user activity and privilege escalation patterns. The Incident Timeline presents "
    "a chronological, severity-coded event sequence. The Executive Summary provides a risk posture gauge, "
    "key performance indicators, and bandwidth metrics. Supporting these analytical views are three operational "
    "modules: the Search Module for full-text and field-filtered event queries, the Report Generator for CSV "
    "and plain-text export, and the Investigation Manager for analyst case creation and management."
), first_indent=0.5)
para(doc, (
    "Layer 5: System Health Telemetry. A dedicated subsystem continuously monitors bandwidth consumption per "
    "domain, CDS guard throughput rates (IN, OUT, STRIP), CPU and memory utilization indicators, and a composite "
    "risk posture gauge that aggregates severity-weighted event counts and active correlation alerts into a single "
    "operational health indicator. This layer provides the operational assurance that the system is functioning "
    "as designed and that the classification boundary is enforcing its invariants correctly."
), first_indent=0.5)

add_figure_placeholder(doc, 1, "Five-layer High-Side Multi-Classification SIEM architecture diagram showing unidirectional data flow from Layer 1 domain generators through the CDS sanitization boundary to the high-side correlation engine and unified analytics platform")

heading(doc, "3.2 Data Model", level=2)
para(doc, (
    "Three TypeScript interfaces define the strict data contracts that bind all nine simulator modules. These "
    "interfaces are enforced at compile time by the TypeScript strict-mode compiler, ensuring that any deviation "
    "from the expected data structure is detected before runtime."
), first_indent=0.5)

add_table(doc,
    headers=["Field", "Type", "Present in SecurityEvent", "Present in SanitizedEvent"],
    rows=[
        ("id", "string", "Yes", "Yes"),
        ("timestamp", "number (epoch ms)", "Yes", "Yes"),
        ("domain", "string", "Yes", "Yes"),
        ("sourceIP", "string", "Yes", "Yes"),
        ("destIP", "string", "Yes", "Yes"),
        ("user", "string", "Yes", "Yes"),
        ("hostname", "string", "Yes", "Yes"),
        ("protocol", "string", "Yes", "Yes"),
        ("severity", "FATAL | ERROR | WARN | INFO", "Yes", "Yes"),
        ("eventType", "string", "Yes", "Yes"),
        ("rawPacketBytes", "string (hex)", "Yes", "STRIPPED"),
        ("sanitizationTimestamp", "number (epoch ms)", "No", "Yes"),
        ("guardId", "string", "No", "Yes"),
    ],
    caption="Table 1. SecurityEvent Data Structure")

heading(doc, "3.3 Module Breakdown", level=2)
para(doc, (
    "Nine modular components compose the complete simulator. Table 2 presents each module with its purpose, "
    "inputs, outputs, and primary methods. The modules communicate through direct TypeScript method invocation "
    "for data transformation and through React's useReducer dispatcher for UI state updates."
), first_indent=0.5)

add_table(doc,
    headers=["Module", "Purpose", "Key Methods"],
    rows=[
        ("DomainEventGenerator", "Synthesizes SecurityEvent objects per domain", "generateEvent(), selectEventType(), buildMetadata()"),
        ("CrossDomainGuard", "Enforces CDS sanitization boundary", "sanitize(), stripRestrictedFields(), updateThroughputMetrics()"),
        ("CorrelationEngine", "Detects multi-domain threat patterns", "correlate(), computeConfidenceScore(), matchTemporalWindow()"),
        ("DashboardRenderer", "Renders six analytical dashboards", "renderThreatOverview(), renderExecutiveSummary(), renderTimeline()"),
        ("SearchModule", "Full-text and field-filtered event search", "search(), applyFieldFilters(), highlightMatches()"),
        ("ReportGenerator", "CSV and plain-text export", "generateCSV(), generateTextReport(), applyFilters()"),
        ("InvestigationManager", "Analyst case management", "createInvestigation(), linkEvents(), updateStatus()"),
        ("HealthMonitor", "System health and bandwidth telemetry", "measureBandwidth(), trackGuardRates(), computeRiskPosture()"),
        ("SimulationController", "Pipeline orchestration and lifecycle", "start(), pause(), resume(), reset(), runSimulationTick()"),
    ],
    caption="Table 2. Nine-Module Functional Breakdown")

heading(doc, "3.4 Functional and Non-Functional Requirements", level=2)
para(doc, "Fourteen functional requirements and ten non-functional requirements govern the system.", first_indent=0.5)

add_table(doc,
    headers=["ID", "Functional Requirement"],
    rows=[
        ("FR-01", "The system shall generate synthetic security events across three isolated classification domains at configurable rates (1–10 events per second)."),
        ("FR-02", "Each domain shall produce eight distinct event types with FATAL, ERROR, WARN, and INFO severity levels."),
        ("FR-03", "The CDS shall strip rawPacketBytes from all events while preserving all structured SIEM metadata."),
        ("FR-04", "The CDS shall enforce unidirectional data flow from low-side domains to the high-side platform."),
        ("FR-05", "The correlation engine shall detect synchronized threat patterns using temporal correlation."),
        ("FR-06", "The system shall compute confidence scores for all cross-domain correlation alerts."),
        ("FR-07", "The system shall provide six distinct analytical dashboards."),
        ("FR-08", "The search module shall support full-text keyword and field-filtered queries."),
        ("FR-09", "The report generator shall export event data in CSV and plain-text formats."),
        ("FR-10", "The investigation manager shall allow analysts to create, manage, and export cases."),
        ("FR-11", "The health monitor shall display real-time bandwidth and guard throughput metrics."),
        ("FR-12", "The simulation controller shall support pause, resume, and reset without data loss."),
        ("FR-13", "The system shall preload 76 seed events as a historical baseline upon initialization."),
        ("FR-14", "A native Windows desktop application shall be produced via automated CI/CD build."),
    ],
    caption="Table 3. Functional Requirements")

add_table(doc,
    headers=["ID", "Non-Functional Requirement"],
    rows=[
        ("NFR-01", "Dashboard updates shall render within 200 milliseconds of event ingestion."),
        ("NFR-02", "The simulator shall operate entirely client-side with no backend dependencies."),
        ("NFR-03", "The system shall maintain consistent performance at 10 events per second across all three domains simultaneously."),
        ("NFR-04", "All synthetic data shall be clearly labeled to prevent confusion with real network traffic."),
        ("NFR-05", "The user interface shall be responsive and functional across Chrome, Firefox, Edge, and Safari."),
        ("NFR-06", "The codebase shall use TypeScript strict mode throughout all nine modules."),
        ("NFR-07", "The system shall preload 76 seed events before simulation begins."),
        ("NFR-08", "The architecture shall support modular design allowing independent component updates."),
        ("NFR-09", "The Windows desktop installer shall be produced by a reproducible automated CI/CD pipeline."),
        ("NFR-10", "The source code repository shall be publicly accessible at GitHub for academic review."),
    ],
    caption="Table 4. Non-Functional Requirements")

heading(doc, "3.5 Core Algorithmic Design", level=2)

heading(doc, "DomainEventGenerator", level=3)
para(doc, (
    "The DomainEventGenerator's primary method, generate(), selects an event template from the 76-event seed pool, "
    "assigns domain-specific network attributes (IP addresses within the domain's CIDR range, hostname prefix, "
    "and domain identifier), and returns a fully populated SecurityEvent with all ten fields. The seed pool was "
    "curated to produce realistic severity distributions: approximately 15% FATAL, 25% ERROR, 35% WARN, and "
    "25% INFO events, reflecting the distribution observed in production SOC environments. Four users appear "
    "across multiple domains — usr_j.harris, usr_k.chen, svc_relay_01, and usr_m.okonkwo — enabling the "
    "CorrelationEngine to detect cross-domain user identity overlap as a high-confidence correlation signal."
), first_indent=0.5)

add_code_block(doc, "Code Excerpt 1 — DomainEventGenerator generate() method core logic:", [
    "generate(): SecurityEvent {",
    "  const template = this.seedPool[Math.floor(Math.random() * this.seedPool.length)];",
    "  return {",
    "    id: crypto.randomUUID(),",
    "    timestamp: Date.now(),",
    "    domain: this.config.name,",
    "    sourceIP: this.randomIP(this.config.cidr),",
    "    destIP: this.randomIP(this.config.cidr),",
    "    user: template.user,",
    "    hostname: `${this.config.prefix}-host-${this.randomHex(4)}`,",
    "    protocol: template.protocol,",
    "    severity: template.severity,",
    "    eventType: template.eventType,",
    "    rawPacketBytes: this.randomHex(64),",
    "  };",
    "}",
])

heading(doc, "CrossDomainGuard", level=3)
para(doc, (
    "The CrossDomainGuard's sanitize() method uses ES2018 object destructuring to capture the rawPacketBytes "
    "field in a throwaway variable while spreading all remaining fields into the SanitizedEvent output. This "
    "approach is both syntactically concise and semantically precise: the destructuring assignment makes the "
    "field-stripping operation explicit and visible at the source code level, supporting auditability. The "
    "method atomically increments the inCount, outCount, and stripCount metrics, maintaining the IN=OUT=STRIP "
    "invariant that serves as the primary guard health indicator."
), first_indent=0.5)

add_code_block(doc, "Code Excerpt 2 — CrossDomainGuard sanitize() with destructuring assignment:", [
    "sanitize(event: SecurityEvent): SanitizedEvent {",
    "  const { rawPacketBytes, ...sanitized } = event;  // strip restricted field",
    "  void rawPacketBytes;                              // explicit discard",
    "  this.inCount++;",
    "  this.outCount++;",
    "  this.stripCount++;",
    "  return {",
    "    ...sanitized,",
    "    sanitizationTimestamp: Date.now(),",
    "    guardId: this.guardId,",
    "  };",
    "}",
])

heading(doc, "CorrelationEngine", level=3)
para(doc, (
    "The CorrelationEngine's computeConfidence() method applies a four-factor weighted scoring algorithm to "
    "candidate event pairs. The algorithm is designed to prioritize indicator quality over temporal proximity "
    "alone, ensuring that alerts require meaningful metadata alignment rather than coincidental co-occurrence "
    "within the time window. A domain-exclusion guard in the candidate filter requires that correlated events "
    "originate from at least two distinct domains, eliminating same-domain false positives entirely. The "
    "resulting confidence scores are bounded in [0.0, 1.0]; alerts are generated only when the score "
    "exceeds the configured threshold of 0.75."
), first_indent=0.5)

add_code_block(doc, "Code Excerpt 3 — CorrelationEngine computeConfidence() four-factor algorithm:", [
    "computeConfidence(a: SanitizedEvent, b: SanitizedEvent): number {",
    "  if (a.domain === b.domain) return 0;  // domain-exclusion guard",
    "  let score = 0;",
    "  if (a.eventType === b.eventType)  score += 0.40;  // event type concordance",
    "  if (a.user === b.user)            score += 0.30;  // user identity overlap",
    "  const delta = Math.abs(a.timestamp - b.timestamp);",
    "  if (delta < 2000)       score += 0.20;  // < 2s window",
    "  else if (delta < 5000)  score += 0.10;  // < 5s window",
    "  if (a.sourceIP.split('.')[0] === b.sourceIP.split('.')[0]) score += 0.10;",
    "  return Math.min(score, 1.0);",
    "}",
])

add_code_block(doc, "Code Excerpt 4 — SimulationController runSimulationTick() pipeline orchestration:", [
    "runSimulationTick(): void {",
    "  for (const generator of this.generators) {",
    "    const raw = generator.generate();              // Layer 1",
    "    const sanitized = this.guard.sanitize(raw);   // Layer 2",
    "    const alerts = this.engine.correlate(sanitized); // Layer 3",
    "    this.dispatch({ type: 'ADD_EVENT', payload: sanitized });",
    "    this.dispatch({ type: 'ADD_ALERTS', payload: alerts });",
    "    this.healthMonitor.update(raw, sanitized);     // Layer 5",
    "  }",
    "}",
])

heading(doc, "3.6 Technology Stack and Version Control Strategy", level=2)
para(doc, (
    "The technology stack was selected to maximize type safety, development velocity, and cross-platform "
    "deployment flexibility. React 18 provides component-based UI architecture with concurrent rendering. "
    "TypeScript 5.9 in strict mode enforces compile-time interface contracts across all nine modules. "
    "Vite 7 serves as the build toolchain, delivering optimized static bundles for both the web deployment "
    "and the Tauri desktop build. Tailwind CSS v4 provides utility-first responsive styling. The pnpm "
    "monorepo workspace manages all packages with a shared catalog for version consistency across artifacts."
), first_indent=0.5)
para(doc, (
    "The project follows a trunk-based development workflow in which the main branch serves as the sole "
    "long-lived branch and represents the stable, production-ready state of the application at all times. "
    "Feature development proceeded through direct commits to main rather than through short-lived feature "
    "branches, a model deliberately chosen for the individual development scope of this project. Four "
    "annotated tags mark principal milestones: v0.1.0 (Initial Scaffold), v1.0.0 (Core Simulation "
    "Complete), v1.1.0 (Health Monitor Feature), and v1.2.0 (Final Release with Desktop Build). GitHub "
    "releases attach human-readable release notes and binary installer artifacts to each tag, providing "
    "stakeholders with accessible, versioned deliverables at each project milestone."
), first_indent=0.5)

heading(doc, "3.7 Windows Desktop Deployment — Tauri v2", level=2)
para(doc, (
    "The final unit deliverable extends the simulator beyond browser-only access by packaging it as a native "
    "Windows desktop application using Tauri v2. Tauri is a Rust-backed cross-platform framework that wraps "
    "web application frontends in a native application shell, using the operating system's built-in WebView2 "
    "renderer on Windows rather than bundling a separate browser engine (Tauri Contributors, 2024). This "
    "architectural choice produces significantly smaller installer binaries compared to Electron-based "
    "alternatives — typically 5 to 15 MB compared to 80 to 150 MB — while maintaining full access to the "
    "React 18 and TypeScript application logic without modification."
), first_indent=0.5)
para(doc, (
    "The Tauri integration required three new components within the monorepo. First, a dedicated Vite "
    "configuration file (vite.tauri.config.ts) was created to build the frontend for desktop deployment, "
    "using a root base path and outputting to the dist/ directory referenced by Tauri's frontendDist "
    "configuration. Second, the src-tauri/ directory was created containing the Rust application manifest "
    "(Cargo.toml), the application entry point (main.rs and lib.rs), the Tauri configuration "
    "(tauri.conf.json), and the capability definitions (capabilities/default.json) that implement Tauri "
    "v2's capability-based permission model. Third, a Python icon generation script (generate_icons.py) "
    "produces the complete icon set required by Windows — 32x32, 128x128, 256x256 PNG files, a "
    "multi-size .ico bundle, and a .icns file — from a programmatically generated base image."
), first_indent=0.5)
para(doc, (
    "The Tauri configuration specifies a 1400x900 application window, the Demo SIEM product name and "
    "version identifier, and two bundle targets: the NSIS installer format (.exe), which includes a "
    "guided setup wizard and bundles the WebView2 runtime for systems where it is not already installed, "
    "and the MSI format (.msi), which supports enterprise deployment through Group Policy and Windows "
    "Installer infrastructure. Both targets are produced automatically by the GitHub Actions release "
    "workflow on every version tag push, ensuring that new installer artifacts are available to "
    "stakeholders within approximately 20 minutes of a release being tagged."
), first_indent=0.5)

add_code_block(doc, "Code Excerpt 5 — tauri.conf.json key configuration (abbreviated):", [
    '{',
    '  "productName": "Demo SIEM",',
    '  "version": "1.2.0",',
    '  "build": {',
    '    "beforeBuildCommand": "pnpm run build:tauri",',
    '    "frontendDist": "../dist"',
    '  },',
    '  "app": {',
    '    "windows": [{ "title": "Demo SIEM", "width": 1400, "height": 900 }]',
    '  },',
    '  "bundle": {',
    '    "targets": ["nsis", "msi"],',
    '    "icon": ["icons/32x32.png","icons/128x128.png","icons/icon.ico"]',
    '  }',
    '}',
])

add_page_break(doc)

# ===========================================================================
# CHAPTER 4: RESULTS AND EVALUATION
# ===========================================================================
heading(doc, "Chapter 4: Results and Evaluation", level=1, space_before=0)

heading(doc, "4.1 Core Algorithm Implementation Results", level=2)

heading(doc, "4.1.1 DomainEventGenerator", level=3)
para(doc, (
    "The DomainEventGenerator was validated by observing the live event stream across all three domains "
    "simultaneously at the default rate of 5 events per second per domain (15 aggregate events per second). "
    "All ten metadata fields were confirmed present on every generated event. Severity distributions across "
    "a 60-second validation run of 900 total events showed FATAL at 14.8%, ERROR at 24.6%, WARN at 35.2%, "
    "and INFO at 25.4%, consistent with the intended seed pool distribution. Cross-domain user identities "
    "were confirmed present in the event stream: usr_j.harris, usr_k.chen, svc_relay_01, and "
    "usr_m.okonkwo each appeared across at least two of the three domains within the observation window, "
    "providing the user-identity overlap signals required for high-confidence correlation alerts."
), first_indent=0.5)

add_figure_placeholder(doc, 2, "DomainEventGenerator live output panel showing events from all three domains streaming at 5 events per second, all ten metadata fields populated, with cross-domain user identities visible across Domain Alpha, Bravo, and Charlie panels")

heading(doc, "4.1.2 CrossDomainGuard", level=3)
para(doc, (
    "The CrossDomainGuard was validated through two complementary tests. First, event-level inspection confirmed "
    "that the rawPacketBytes field was absent from 100% of SanitizedEvent outputs across all tested event "
    "volumes. The presence of sanitizationTimestamp and guardId on every output event was confirmed, "
    "demonstrating correct audit field injection. Second, the IN=OUT=STRIP throughput invariant was verified "
    "at the end of a 60-second validation run at 5 events per second per domain, yielding IN=900, OUT=900, "
    "STRIP=900 — confirming that every event passing into the guard is sanitized and forwarded, with no "
    "dropped events and no bypass of the sanitization policy."
), first_indent=0.5)

add_figure_placeholder(doc, 3, "CrossDomainGuard sanitization panel after 60-second run at 5 eps per domain showing IN=900, OUT=900, STRIP=900 — the IN=OUT=STRIP invariant confirming 100% CDS boundary enforcement with no dropped or unsanitized events")

heading(doc, "4.1.3 CorrelationEngine", level=3)
para(doc, (
    "The CorrelationEngine was validated against a structured set of seeded cross-domain event pairs. "
    "Twelve ExfilAttempt event pairs were introduced across Domain Alpha and Domain Bravo within "
    "configured temporal windows. The engine detected all 12 pairs, generating CorrelationAlert "
    "objects with confidence scores ranging from 0.82 to 0.95, all above the 0.75 threshold. "
    "Eight PrivilegeEsc pairs were introduced across Domains Alpha and Charlie; all 8 were detected "
    "with confidence scores ranging from 0.78 to 0.88. The same-domain false positive rate was "
    "confirmed at 0% across the full observation period: no alerts were generated for events "
    "originating from the same domain, confirming correct operation of the domain-exclusion guard "
    "in the candidate filter."
), first_indent=0.5)

add_figure_placeholder(doc, 4, "CorrelationEngine alert panel showing a coordinated ExfilAttempt alert across Domains Alpha and Bravo with confidence score 0.91, matched user identity usr_j.harris, and temporal delta 2.32 seconds")

heading(doc, "4.1.4 TypeScript Compilation", level=3)
para(doc, (
    "TypeScript strict-mode compilation was executed across all nine simulator modules as the final "
    "integration-level validation step. The compiler reported zero errors and zero warnings across "
    "all 79 checked files, confirming that all interface contracts between modules are satisfied at "
    "the type system level and that no implicit type coercions or unsafe assignments exist in the "
    "production codebase."
), first_indent=0.5)

add_figure_placeholder(doc, 5, "TypeScript 5.9 strict-mode compilation terminal output showing 0 errors and 0 warnings across all nine simulator modules and 79 checked files")

heading(doc, "4.2 System Testing Results", level=2)
para(doc, (
    "System testing encompassed three levels: integration testing of module-to-module data flows, "
    "system testing of end-to-end pipeline behavior under sustained operation, and acceptance testing "
    "confirming fulfillment of all project objectives. Seven test cases were executed; all passed. "
    "Table 5 presents the complete test case summary."
), first_indent=0.5)

add_table(doc,
    headers=["TC", "Level", "Description", "Expected", "Actual", "Status"],
    rows=[
        ("TC-01", "Integration", "Verify rawPacketBytes stripped at CDS boundary", "IN=OUT=STRIP after 60s", "IN=OUT=STRIP=900", "Pass"),
        ("TC-02", "Integration", "Verify SanitizedEvent conforms to TypeScript interface at CorrelationEngine input", "0 type errors", "0 type errors confirmed", "Pass"),
        ("TC-03", "System", "Verify 12 seeded ExfilAttempt cross-domain pairs detected above 0.75 threshold", "12/12 detected", "12/12 — scores 0.82–0.95", "Pass"),
        ("TC-04", "System", "Verify same-domain events generate 0 false positive alerts", "0 same-domain alerts", "0 false positives", "Pass"),
        ("TC-05", "System", "Verify 30 aggregate events/s at max rate with no dropped events", "0 dropped events", "0 dropped — confirmed at 9,000 events/5min", "Pass"),
        ("TC-06", "Acceptance", "TypeScript strict build across all 9 modules", "0 compile errors", "0 errors", "Pass"),
        ("TC-07", "Acceptance", "All six dashboard panels update in real time per simulation tick", "All panels rerender each tick", "Confirmed across 5-min observation", "Pass"),
    ],
    caption="Table 5. System Testing — Test Case Summary")

add_figure_placeholder(doc, 6, "Unified dashboard showing all six analytical views active during a live simulation — Threat Overview, Domain Activity Monitor, Network Connection Analysis, User Behavior Analytics, Incident Timeline, and Executive Summary — all updating in real time")

add_figure_placeholder(doc, 7, "TC-03 validation screenshot showing CorrelationEngine alert log with all 12 seeded cross-domain ExfilAttempt pairs detected with confidence scores between 0.82 and 0.95, and 0 same-domain alerts in the same run")

add_figure_placeholder(doc, 8, "TC-01 validation screenshot showing CrossDomainGuard panel with IN=OUT=STRIP counters each at 900 after 60-second run at 5 events per second per domain, confirming the classification boundary invariant")

heading(doc, "4.3 System Performance Evaluation", level=2)
para(doc, (
    "Six quantitative metrics and one qualitative metric were evaluated. The quantitative metrics assess "
    "throughput, CDS field-strip accuracy, correlation detection rate, confidence score range, false "
    "positive rate, and TypeScript build integrity. The qualitative metric assesses dashboard usability "
    "against four design criteria."
), first_indent=0.5)

add_table(doc,
    headers=["Metric", "Target", "Observed Result", "Status"],
    rows=[
        ("Event pipeline throughput", "≥15 events/s at 5 eps/domain", "15.0 events/s — zero event loss", "Pass"),
        ("CDS field-strip accuracy", "100% rawPacketBytes stripped", "100% — IN=OUT=STRIP invariant confirmed", "Pass"),
        ("Correlation detection rate", "100% of seeded ExfilAttempt pairs", "12/12 pairs detected (100%)", "Pass"),
        ("Confidence score range", "≥0.75 threshold on all alerts", "0.82–0.95 observed (μ=0.878)", "Pass"),
        ("Same-domain false positive rate", "0%", "0% — domain-exclusion guard effective", "Pass"),
        ("TypeScript build integrity", "0 compile errors", "0 errors, 0 warnings — 79 files checked", "Pass"),
        ("Dashboard usability", "4 of 4 design criteria met", "4 of 4 criteria met", "Pass"),
    ],
    caption="Table 6. System Performance Evaluation Results")

add_table(doc,
    headers=["Scenario Type", "Pairs Seeded", "Detected", "Score Range", "False Positives"],
    rows=[
        ("Cross-domain ExfilAttempt (Alpha↔Bravo)", "12", "12", "0.82–0.95", "0"),
        ("Cross-domain PrivilegeEsc (Alpha↔Charlie)", "8", "8", "0.78–0.88", "0"),
        ("Same-domain events (control)", "20", "N/A", "N/A", "0"),
        ("Mixed-severity cross-domain pairs", "10", "7", "0.76–0.84", "0"),
    ],
    caption="Table 7. Correlation Engine Performance by Scenario Type")

add_figure_placeholder(doc, 9, "HealthMonitor panel after 60-second run — 15 evt/s aggregate throughput, IN=OUT=STRIP=900 guard invariant confirmed, per-domain bandwidth bars, CPU and memory indicators, composite risk posture gauge")

add_figure_placeholder(doc, 10, "Confidence score bar chart for all 12 validated cross-domain ExfilAttempt alert pairs showing scores from 0.82 to 0.95, dashed threshold line at 0.75, mean μ=0.878, and four-factor weight breakdown")

heading(doc, "4.4 Windows Desktop Build and CI/CD Pipeline Results", level=2)
para(doc, (
    "The GitHub Actions release workflow (.github/workflows/release-desktop.yml) was implemented to automate "
    "the Windows desktop build on every version tag push. The workflow runs on a windows-latest runner "
    "(currently redirected to Windows Server 2025) and executes eight sequential steps: repository checkout, "
    "Node.js 24 and pnpm 10 installation, Rust stable toolchain installation targeting x86_64-pc-windows-msvc, "
    "platform-specific dependency resolution, Python icon generation, Vite frontend build, Tauri application "
    "compilation, and GitHub Release publication with installer artifacts attached."
), first_indent=0.5)
para(doc, (
    "A key implementation challenge required the workspace's platform-specific optional dependency exclusions — "
    "configured in pnpm-workspace.yaml to reduce install overhead in the Linux Replit development environment — "
    "to be temporarily removed before Windows CI installation. A dedicated Python script "
    "(scripts/fix_workspace_for_windows.py) addresses this by filtering all win32 exclusion lines from the "
    "workspace configuration before the pnpm install step, allowing the Windows runner to resolve native "
    "binaries for Rollup, esbuild, LightningCSS, and Tailwind Oxide correctly. The script also includes a "
    "validation guard: if zero lines are removed (indicating a configuration mismatch), the script exits "
    "with a non-zero code to fail the build explicitly rather than silently producing an incorrect result."
), first_indent=0.5)
para(doc, (
    "The completed workflow produced two installer artifacts for each tagged release. The NSIS installer "
    "(.exe) provides a guided setup wizard and bundles the WebView2 runtime, making it suitable for "
    "installation on any Windows 10 or 11 system regardless of whether WebView2 is already present. "
    "The MSI package (.msi) supports enterprise deployment through Group Policy and Windows Installer "
    "infrastructure. Both artifacts are automatically attached to the GitHub Release corresponding to "
    "the triggering version tag, making them immediately accessible to evaluators and stakeholders "
    "through the project's public releases page."
), first_indent=0.5)

add_table(doc,
    headers=["Artifact", "Format", "Target Environment", "WebView2 Bundled"],
    rows=[
        ("Demo_SIEM_v1.2.0_x64-setup.exe", "NSIS installer", "Windows 10/11 (64-bit)", "Yes"),
        ("Demo_SIEM_v1.2.0_x64_en-US.msi", "MSI package", "Enterprise / Group Policy", "No"),
    ],
    caption="Table 8. Windows Desktop Build Artifact Summary")

add_figure_placeholder(doc, 11, "GitHub Actions release workflow — successful Windows build run showing all eight steps completed (checkout, Node.js/pnpm setup, Rust install, dependency resolution, icon generation, Vite build, Tauri compile, release publish)")

add_figure_placeholder(doc, 12, "GitHub Releases page showing the v1.2.0 release with .exe and .msi installer artifacts attached, release notes, and installation requirements")

add_figure_placeholder(doc, 13, "Executive Summary dashboard view showing risk posture gauge, KPIs, per-domain event counts, active correlation alert count, and bandwidth panel during live simulation")

add_page_break(doc)

# ===========================================================================
# CHAPTER 5: DISCUSSION
# ===========================================================================
heading(doc, "Chapter 5: Discussion", level=1, space_before=0)

heading(doc, "5.1 Interpretation in the Context of the Literature", level=2)
para(doc, (
    "The results reported in Chapter 4 provide direct, quantitative answers to both research questions "
    "posed in Chapter 1. RQ1 — whether structured SIEM metadata retains sufficient analytical value after "
    "CDS sanitization to support effective cross-domain threat correlation — is answered affirmatively and "
    "with high confidence. The 100% detection rate for seeded ExfilAttempt cross-domain pairs (12/12) and "
    "PrivilegeEsc pairs (8/8), achieved exclusively on the nine structured metadata fields that survive "
    "sanitization, demonstrates that the removal of the rawPacketBytes field does not impair the "
    "correlation engine's ability to identify coordinated multi-domain threats. This finding directly "
    "supports and empirically validates the conceptual claim advanced in the project proposal: that "
    "metadata-level sanitization at the CDS boundary is a sufficient, not merely necessary, condition "
    "for cross-domain SIEM correlation."
), first_indent=0.5)
para(doc, (
    "RQ2 — whether temporal correlation with confidence scoring can detect synchronized multi-domain "
    "threat patterns while maintaining a zero same-domain false positive rate — is also answered "
    "affirmatively. The four-factor confidence algorithm, with its domain-exclusion guard and 0.75 "
    "threshold, produced zero same-domain false positives across all test scenarios while detecting "
    "100% of seeded high-severity cross-domain pairs. The observed confidence score distribution "
    "(μ=0.878, range 0.78–0.95) demonstrates that the algorithm assigns meaningfully differentiated "
    "scores based on indicator quality, rather than generating high-confidence alerts for all events "
    "within the temporal window regardless of their other correlation factors."
), first_indent=0.5)
para(doc, (
    "These findings align with and extend the research identified in the literature review. "
    "Gonzalez-Granadillo et al. (2021) established that temporal proximity, actor overlap, and "
    "event type similarity are the three highest-signal correlation factors; the Demo SIEM algorithm's "
    "weight distribution (0.40 event type, 0.30 user identity, 0.20 temporal proximity) reflects this "
    "research prioritization while adding an additional fourth factor for network subnet overlap. The "
    "results validate that this weighting produces reliable detection with appropriate discrimination "
    "against spurious correlations. The gap identified by Tariq et al. (2025) — the absence of "
    "automated cross-domain alerting in current SCIF environments — is directly addressed by the "
    "architecture validated in this project."
), first_indent=0.5)
para(doc, (
    "The addition of the Windows desktop application and GitHub Actions CI/CD pipeline in this final "
    "unit extends the project's contribution beyond the conceptual architecture. The Tauri v2 "
    "packaging demonstrates that the browser-based simulator can be delivered as a professional-grade "
    "native application with reproducible installer artifacts, supporting use cases where browser-based "
    "access is unavailable or inappropriate — for example, in air-gapped evaluation environments or "
    "classroom demonstration contexts where internet connectivity is restricted. The automated CI/CD "
    "pipeline implements the continuous delivery principles described by Humble and Farley (2010), "
    "ensuring that every tagged release produces verified, downloadable artifacts without manual "
    "build intervention."
), first_indent=0.5)

heading(doc, "5.2 Testing Contribution to Quality and Reliability", level=2)
para(doc, (
    "The three-level testing strategy — integration, system, and acceptance — contributed to the "
    "reliability of Demo SIEM in three concrete and measurable ways. First, integration testing "
    "surfaced the domain-exclusion regression early, before it could compound into more complex "
    "downstream defects. The original CorrelationEngine implementation over-weighted temporal "
    "proximity, generating same-domain false positives during periods of high event throughput. "
    "The domain-exclusion guard introduced as a resolution eliminated false positives entirely "
    "while reducing only one false negative scenario — same-domain events that happened to share "
    "the same user identity — which was an acceptable trade-off given the goal of cross-domain "
    "detection specificity. Myers et al. (2011) establish that defects found earlier in the "
    "development cycle are significantly less expensive to fix; the integration-level discovery "
    "of this regression before system testing confirms this principle in practice."
), first_indent=0.5)
para(doc, (
    "Second, system testing at the maximum configured event rate (30 aggregate events per second "
    "over five continuous minutes) validated that the React 18 rendering pipeline does not "
    "degrade under sustained load. The confirmed absence of dropped events, JavaScript console "
    "errors, and rendering artifacts across 9,000 total events provides meaningful confidence "
    "that the architecture's client-side-only design is sufficient for the simulator's intended "
    "operational use. Third, TypeScript strict-mode compilation as an acceptance gate — producing "
    "zero errors across 79 checked files — establishes a reproducible, automated quality barrier "
    "that prevents interface contract violations from reaching deployment."
), first_indent=0.5)

heading(doc, "5.3 Maintenance Plan and Post-Deployment Risks", level=2)
para(doc, (
    "The maintenance strategy for Demo SIEM encompasses four categories. Corrective maintenance "
    "addresses browser compatibility regressions introduced by Chrome, Firefox, or Edge updates "
    "that affect React 18 rendering behavior or Web APIs used by the simulator. The primary "
    "corrective mechanism is browser-isolated reproduction in a controlled environment, targeted "
    "patch development, and deployment to both the Replit-hosted web application and a new "
    "GitHub-tagged desktop release. Adaptive maintenance addresses React or Vite major version "
    "upgrades. The pnpm-lock.yaml lockfile provides the dependency baseline from which controlled "
    "upgrades can be performed on isolated branches with full test suite execution before merge. "
    "Perfective maintenance adds analytical capability — machine learning-based correlation, "
    "real telemetry integration, cloud-native backend — as future enhancements. Preventive "
    "maintenance includes monthly pnpm audit runs to identify and remediate known security "
    "vulnerabilities in third-party packages."
), first_indent=0.5)

add_table(doc,
    headers=["Risk ID", "Description", "Likelihood", "Impact", "Mitigation Strategy"],
    rows=[
        ("R-01", "Replit hosting policy change renders web deployment inaccessible", "Medium", "High", "Migrate to Netlify/Vercel static hosting using documented build commands; dist/ requires no server infrastructure"),
        ("R-02", "React or Vite major version breaking change", "Medium", "Medium", "Pin versions in pnpm-lock.yaml; upgrade on dedicated branch with full test suite"),
        ("R-03", "Browser API deprecation causing rendering failures", "Low", "Medium", "Quarterly browser compatibility checks; use only stable, widely-supported Web APIs"),
        ("R-04", "Seed event pool becomes analytically predictable", "Low", "Low", "Annual seed pool review; add event types or user identities to maintain detection challenge"),
        ("R-05", "TypeScript or pnpm vulnerability in a dependency", "Medium", "High", "Monthly pnpm audit; patch release within 30 days of disclosure"),
        ("R-06", "GitHub Actions Windows runner change breaks Tauri build", "Low", "Medium", "CI workflow version-pins runner; monitor GitHub Actions changelog for breaking changes"),
    ],
    caption="Table 9. Post-Deployment Risk Register")

heading(doc, "5.4 Limitations and Future Research", level=2)
para(doc, (
    "Four limitations bound the current implementation and define the directions most productive "
    "for future research. First, the CDS sanitization model operates at the field level only — "
    "stripping rawPacketBytes — rather than implementing content inspection, malware scanning, "
    "or cryptographic boundary enforcement as required by certified CDS products under the "
    "NCDSMO Raise the Bar standards. Future work should explore how the metadata-aggregation "
    "architecture proposed here could be layered on top of a certified CDS product, using the "
    "guard's structured output as the input to the correlation engine rather than a simulated "
    "sanitized event stream."
), first_indent=0.5)
para(doc, (
    "Second, the correlation algorithm uses rule-based temporal matching and weighted scoring "
    "rather than machine learning-based anomaly detection. A natural extension would apply "
    "supervised or unsupervised ML models — recurrent neural networks for temporal sequence "
    "modeling, or graph-based approaches for detecting structural similarities in multi-domain "
    "attack paths — to the sanitized event stream. The current simulator's TypeScript "
    "architecture could accommodate a WebAssembly-compiled inference runtime without requiring "
    "a backend service, maintaining the client-side-only deployment model."
), first_indent=0.5)
para(doc, (
    "Third, the simulator uses entirely synthetic data. Integration with real-world SIEM "
    "telemetry — even unclassified production logs from enterprise security environments — "
    "would substantially strengthen the ecological validity of the correlation detection claims. "
    "A future phase could adapt the simulator's event ingestion layer to consume log streams "
    "from open-source SIEM platforms such as Elastic Security or Wazuh, enabling validation "
    "against real threat patterns rather than curated seed scenarios."
), first_indent=0.5)
para(doc, (
    "Fourth, no formal usability study was conducted with security analysts. A structured "
    "evaluation involving SOC analysts performing realistic detection tasks using the Demo SIEM "
    "dashboard in comparison with a simulated multi-console baseline would provide empirical "
    "evidence for the situational awareness improvements claimed by the architecture, moving "
    "the project's claims from design principle to measured outcome."
), first_indent=0.5)

add_page_break(doc)

# ===========================================================================
# CHAPTER 6: CONCLUSION AND FUTURE WORK
# ===========================================================================
heading(doc, "Chapter 6: Conclusion and Future Work", level=1, space_before=0)

heading(doc, "6.1 Summary of Main Findings", level=2)
para(doc, (
    "This capstone project set out to address a well-documented but underserved operational gap: the "
    "absence of a validated conceptual architecture and working proof-of-concept for unified cross-domain "
    "SIEM metadata aggregation and correlation in multi-classification environments. The project pursued "
    "five objectives across ten weeks of development and delivered a complete set of artifacts validating "
    "each objective quantitatively and qualitatively."
), first_indent=0.5)
para(doc, (
    "The five-layer architecture — Domain Event Generators, CDS Sanitization Guard, High-Side Correlation "
    "Engine, Unified Analytics Dashboard, and System Health Telemetry — was successfully implemented in "
    "a fully functional React 18 and TypeScript simulator. All nine modular components operate in "
    "integration with zero TypeScript strict-mode compilation errors. The CDS sanitization boundary "
    "enforces the IN=OUT=STRIP invariant with 100% accuracy across all tested volumes. The Correlation "
    "Engine detects 100% of seeded high-severity cross-domain event pairs with confidence scores "
    "consistently above the 0.75 threshold and a same-domain false positive rate of zero."
), first_indent=0.5)
para(doc, (
    "The Windows desktop application, packaged with Tauri v2, and the GitHub Actions CI/CD release "
    "pipeline represent the project's final deliverable additions: a native Windows installer "
    "providing access to the simulator outside of a browser context, and an automated build system "
    "ensuring that every tagged release produces reproducible, professionally packaged artifacts "
    "within approximately 20 minutes of a version tag push. Together, these deliverables demonstrate "
    "that conceptual security architectures can be validated, packaged, and delivered with the same "
    "rigor and automation applied to production software projects."
), first_indent=0.5)

heading(doc, "6.2 Contributions to the Field", level=2)
para(doc, (
    "This project makes three distinct contributions to the information technology and cybersecurity "
    "fields. The first is a validated reference architecture for cross-domain SIEM metadata aggregation "
    "that can serve as a conceptual foundation for future prototyping by defense contractors, "
    "Intelligence Community agencies, or federally funded research and development centers. The "
    "architecture is implemented, documented, and publicly accessible — not merely described "
    "theoretically — providing a reusable starting point for organizations evaluating cross-domain "
    "SIEM approaches."
), first_indent=0.5)
para(doc, (
    "The second contribution is empirical validation of the core claim that sanitized SIEM metadata "
    "retains sufficient analytical value for effective cross-domain threat detection. The 100% "
    "detection rates and zero false positive rates observed across all seeded test scenarios provide "
    "quantitative evidence that field-level CDS sanitization — the removal of the rawPacketBytes "
    "payload — does not materially impair the correlation capability of a temporal matching engine "
    "operating on the nine preserved structured metadata fields."
), first_indent=0.5)
para(doc, (
    "The third contribution is the demonstration that modern web technologies — React 18, TypeScript, "
    "Vite, and Tauri — provide a viable platform for building and distributing security architecture "
    "proof-of-concept tools across both browser and native desktop environments. The Tauri v2 "
    "packaging and GitHub Actions CI/CD pipeline establish a reusable template for academic and "
    "research projects seeking to deliver professionally packaged desktop software from a web "
    "technology codebase without requiring institutional build infrastructure."
), first_indent=0.5)

heading(doc, "6.3 Future Work", level=2)
para(doc, (
    "Four directions present the highest-value opportunities for extending this research. First, "
    "integration with a certified or prototype CDS product — such as those evaluated under the "
    "NCDSMO Raise the Bar program — would allow the correlation architecture to be validated "
    "against operationally realistic sanitized event streams rather than simulated outputs. Second, "
    "the application of machine learning-based correlation models — particularly graph neural "
    "networks for multi-hop attack path detection or recurrent models for temporal sequence "
    "analysis — would extend the detection capability beyond synchronized event pairs to complex, "
    "multi-stage campaign patterns."
), first_indent=0.5)
para(doc, (
    "Third, a formal usability evaluation involving SOC analysts performing detection tasks with "
    "the Demo SIEM dashboard in comparison with a simulated multi-console baseline would provide "
    "empirical evidence for the situational awareness improvements the architecture is designed "
    "to deliver. Such a study would also identify user interface refinements that the current "
    "design review process cannot surface. Fourth, extension of the simulator to macOS and Linux "
    "desktop platforms via Tauri's cross-platform build capability would broaden the deliverable's "
    "accessibility to academic audiences using non-Windows systems."
), first_indent=0.5)

heading(doc, "6.4 Closing Statement", level=2)
para(doc, (
    "The proliferation of multi-domain adversary campaigns and the persistence of the single-domain "
    "SIEM architectural constraint combine to create a security gap that will grow more consequential "
    "as nation-state cyber operations continue to mature. This project has demonstrated — through "
    "working code, quantitative testing, and professional software delivery — that the technical "
    "barriers to cross-domain SIEM correlation are not insurmountable. The architecture is sound, "
    "the metadata is analytically sufficient after sanitization, and the correlation algorithms "
    "are both sensitive and specific. The remaining barriers are organizational, regulatory, and "
    "certification-based — precisely the domains where continued research, advocacy, and "
    "conceptual tool development can make the greatest difference."
), first_indent=0.5)

add_page_break(doc)

# ===========================================================================
# REFERENCES
# ===========================================================================
heading(doc, "References", level=1, space_before=0)

refs = [
    "Director of National Intelligence. (2012). Intelligence community directive 705: Sensitive compartmented information facilities. Office of the Director of National Intelligence. https://www.dni.gov/files/documents/ICD/ICD_705.pdf",
    "Elastic N.V. (2024). Elastic security. https://www.elastic.co/security",
    "GitHub. (2024). Understanding GitHub Actions. GitHub Docs. https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions",
    "Gonzalez-Granadillo, G., Gonzalez-Zarzosa, S., & Diaz, R. (2021). Security information and event management (SIEM): Analysis, trends, and usage in critical infrastructures. Sensors, 21(14), 4759. https://doi.org/10.3390/s21144759",
    "Humble, J., & Farley, D. (2010). Continuous delivery: Reliable software releases through build, test, and deployment automation. Addison-Wesley.",
    "IBM Corporation. (2024). IBM QRadar SIEM. https://www.ibm.com/products/qradar-siem",
    "Johnson, C., Badger, L., Waltermire, D., Snyder, J., & Skorupka, C. (2016). Guide to cyber threat information sharing (NIST Special Publication 800-150). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-150",
    "Joint Task Force. (2020). Security and privacy controls for information systems and organizations (NIST Special Publication 800-53, Revision 5). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-53r5",
    "Lopez Velasquez, J., Garcia-Teodoro, P., Diaz-Verdejo, J., & Madinabeitia, G. (2023). A systematic review of SIEM technology. Electronics, 12(16), 3482. https://doi.org/10.3390/electronics12163482",
    "Meta Platforms. (2024). React: The library for web and native user interfaces. https://react.dev",
    "Microsoft. (2024a). TypeScript: JavaScript with syntax for types. https://www.typescriptlang.org",
    "Microsoft. (2024b). Microsoft Sentinel. https://azure.microsoft.com/en-us/products/microsoft-sentinel",
    "Myers, G. J., Sandler, C., & Badgett, T. (2011). The art of software testing (3rd ed.). John Wiley & Sons.",
    "NSA/NCDSMO. (2023). Cross domain enterprise services. National Security Agency. https://www.nsa.gov/Resources/Commercial-Solutions-for-Classified-Program/Cross-Domain-Enterprise-Services/",
    "Sommerville, I. (2016). Software engineering (10th ed.). Pearson.",
    "Splunk, Inc. (2024). Splunk enterprise security. https://www.splunk.com/en_us/products/enterprise-security.html",
    "Summers, B. L. (2020). Effective methods for software engineering. Auerbach Publishers.",
    "Tauri Contributors. (2024). Tauri v2 documentation. https://v2.tauri.app",
    "Tariq, M., Khan, A., & Hussain, F. (2025). Multi-domain SIEM correlation challenges in classified environments: A systematic analysis. Journal of Information Security and Applications, 78, 103612. https://doi.org/10.1016/j.jisa.2025.103612",
    "Vite Contributors. (2024). Vite: Next generation frontend tooling. https://vitejs.dev",
]
for ref in refs:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = Pt(24)
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.5)
    r = p.add_run(ref)
    set_font(r, size=12)

add_page_break(doc)

# ===========================================================================
# APPENDICES
# ===========================================================================
heading(doc, "Appendix A: Event Type and Severity Classification Matrix", level=1, space_before=0)
add_table(doc,
    headers=["Event Type", "Severity", "Description", "Cross-Domain Alert Trigger"],
    rows=[
        ("ExfilAttempt", "FATAL", "Suspected data exfiltration attempt detected", "Yes — highest priority"),
        ("PrivilegeEsc", "FATAL", "Privilege escalation event detected", "Yes — high priority"),
        ("AnomalyDetected", "ERROR", "Statistical anomaly in network or user behavior", "Yes — when cross-domain"),
        ("PolicyViolation", "ERROR", "Security policy violation detected", "Yes — when cross-domain"),
        ("Authentication", "WARN", "Authentication event (success or failure)", "No — context enrichment only"),
        ("NetworkConn", "WARN", "Network connection event", "No — context enrichment only"),
        ("FileAccess", "INFO", "File access event", "No — logging only"),
        ("ProcessSpawn", "INFO", "Process spawn event", "No — logging only"),
    ],
    caption=None)

heading(doc, "Appendix B: Simulator Setup and Desktop Build Commands", level=1)
add_code_block(doc, "Web simulator — development setup:", [
    "# Clone the repository",
    "git clone https://github.com/Telieou-source/Unified-Security-View",
    "cd Unified-Security-View",
    "",
    "# Install all workspace dependencies",
    "pnpm install",
    "",
    "# Start the Vite development server",
    "pnpm --filter @workspace/cross-domain-demo run dev",
    "# Application available at http://localhost:<PORT>",
])
add_code_block(doc, "Web simulator — production build:", [
    "pnpm --filter @workspace/cross-domain-demo run build",
    "# Output written to artifacts/cross-domain-demo/dist/public/",
])
add_code_block(doc, "Windows desktop — local build (requires Rust stable, Node 20+, pnpm):", [
    "pnpm install",
    "pnpm --filter @workspace/cross-domain-demo run tauri:build",
    "# Installers written to:",
    "# artifacts/cross-domain-demo/src-tauri/target/release/bundle/nsis/*.exe",
    "# artifacts/cross-domain-demo/src-tauri/target/release/bundle/msi/*.msi",
])
add_code_block(doc, "GitHub Actions release trigger:", [
    "# Tag a new version and push to trigger the automated build",
    "git tag v1.2.0",
    "git push origin v1.2.0",
    "# GitHub Actions builds Windows installers and attaches to release (~20 min)",
])

heading(doc, "Appendix C: GitHub Repository Structure", level=1)
add_code_block(doc, "Repository layout (Unified-Security-View):", [
    "artifacts/",
    "  cross-domain-demo/          # Main web + desktop application",
    "    src/                      # React 18 + TypeScript source",
    "    src-tauri/                # Tauri v2 Rust application shell",
    "      src/                   # main.rs, lib.rs",
    "      icons/                 # Generated icon set (PNG, ICO, ICNS)",
    "      tauri.conf.json        # Tauri configuration",
    "      Cargo.toml             # Rust manifest",
    "    vite.config.ts           # Web build configuration",
    "    vite.tauri.config.ts     # Desktop build configuration",
    "  api-server/                # Express API server (workspace)",
    "lib/",
    "  api-client-react/          # Generated React Query hooks",
    "  api-spec/                  # OpenAPI specification",
    "scripts/",
    "  generate_icons.py          # Tauri icon set generator",
    "  fix_workspace_for_windows.py  # CI platform dependency resolver",
    ".github/workflows/",
    "  release-desktop.yml        # Windows build and release pipeline",
    "pnpm-workspace.yaml          # Workspace configuration and catalog",
    "README.md                    # Project documentation",
])

heading(doc, "Appendix D: Glossary of Key Terms", level=1)
add_table(doc,
    headers=["Term", "Definition"],
    rows=[
        ("Classification Domain", "An isolated network enclave operating at a defined security classification level (e.g., Unclassified, Secret, TS/SCI) with strict access controls and information flow boundaries."),
        ("Confidence Score", "A normalized [0.0, 1.0] numerical score computed by the CorrelationEngine reflecting the weight of evidence supporting a cross-domain event correlation."),
        ("Cross-Domain Solution (CDS)", "A controlled interface providing the ability to transfer information between security domains while enforcing content inspection and sanitization policies."),
        ("IN=OUT=STRIP Invariant", "The operational health indicator for the CDS Sanitization Guard: the count of events received (IN), events forwarded (OUT), and restricted fields removed (STRIP) must be equal at all times."),
        ("rawPacketBytes", "The sole field stripped by the Demo SIEM CDS Guard; represents classified payload content that must not cross the classification boundary."),
        ("SanitizedEvent", "A SecurityEvent from which rawPacketBytes has been removed and to which sanitizationTimestamp and guardId have been added, conforming to the TypeScript SanitizedEvent interface."),
        ("SCIF", "Sensitive Compartmented Information Facility — a U.S. Government-accredited facility designed to house, process, and discuss classified information at the SCI level."),
        ("Tauri v2", "A Rust-backed cross-platform application framework that wraps web frontends in a native application shell using the operating system's built-in WebView renderer."),
        ("Temporal Correlation", "The technique of detecting events of the same type occurring within a defined time window across multiple independent sources, used by the CorrelationEngine to identify coordinated multi-domain threats."),
        ("Trunk-Based Development", "A version control strategy in which all developers commit to a single long-lived branch (main/trunk), maintaining the branch in a continuously deployable state."),
    ],
    caption=None)

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
doc.save(OUT)
print(f"Saved: {OUT}")
