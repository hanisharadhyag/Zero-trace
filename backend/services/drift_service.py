"""
Configuration Drift Detection Service
Zero-Trace Network Security Auditor
"""

import difflib
from typing import Dict, Any, List, Optional

from parsers.cisco_parser import CiscoParser
from parsers.fortinet_parser import FortinetParser
from parsers.paloalto_parser import PaloAltoParser

from engine.security_rules import SecurityEngine
from engine.risk_score import RiskScoreEngine
from engine.remediation import RemediationEngine
from security.sanitizer import sanitize_config


def normalize_config(config_text: str) -> List[str]:
    """
    Normalize safe differences only:
    - Standardize line endings (\r\n -> \n)
    - Strip trailing whitespace
    Do NOT reorder ACLs or commands.
    """
    if not config_text:
        return []

    lines = config_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    return [line.rstrip() for line in lines]


def get_vendor_parser(vendor: str):
    """Reuse existing vendor parsers."""
    v_lower = vendor.lower()
    if "forti" in v_lower:
        return FortinetParser()
    elif "palo" in v_lower:
        return PaloAltoParser()
    else:
        return CiscoParser()


def compare_configurations(
    old_config_raw: str,
    new_config_raw: str,
    vendor: str = "Cisco",
    device_id: str = "Unknown",
    old_version_label: str = "v1",
    new_version_label: str = "v2",
) -> Dict[str, Any]:
    """
    Core drift comparison engine.
    Uses difflib to compute line diffs and reuses SecurityEngine/RiskScoreEngine
    to assess security posture changes.
    """
    # 1. Normalize line differences
    old_lines = normalize_config(old_config_raw)
    new_lines = normalize_config(new_config_raw)

    # 2. Compute difflib unified line changes
    differ = difflib.Differ()
    diff_generator = list(differ.compare(old_lines, new_lines))

    added_lines: List[str] = []
    removed_lines: List[str] = []
    modified_lines: List[Dict[str, str]] = []
    unchanged_lines: List[str] = []
    diff_view: List[Dict[str, str]] = []

    for line in diff_generator:
        code = line[:2]
        content = line[2:]

        # Sanitize sensitive lines for display
        sanitized_content = sanitize_config(content)

        if code == "+ ":
            added_lines.append(sanitized_content)
            diff_view.append({"type": "added", "line": sanitized_content})
        elif code == "- ":
            removed_lines.append(sanitized_content)
            diff_view.append({"type": "removed", "line": sanitized_content})
        elif code == "  ":
            unchanged_lines.append(sanitized_content)
            diff_view.append({"type": "unchanged", "line": sanitized_content})
        elif code == "? ":
            # difflib hint line
            continue

    total_changes = len(added_lines) + len(removed_lines)

    # 3. Security Analysis using existing SecurityEngine
    parser = get_vendor_parser(vendor)

    try:
        old_device = parser.parse(old_config_raw)
        old_findings_obj = SecurityEngine().analyze(old_device)
        old_findings = [f.model_dump() for f in old_findings_obj]
        old_risk = RiskScoreEngine().calculate(old_findings)
    except Exception:
        old_findings = []
        old_risk = {"score": 100.0, "risk_level": "LOW", "critical": 0, "high": 0, "medium": 0, "low": 0}

    try:
        new_device = parser.parse(new_config_raw)
        new_findings_obj = SecurityEngine().analyze(new_device)
        new_findings = [f.model_dump() for f in new_findings_obj]
        new_risk = RiskScoreEngine().calculate(new_findings)
    except Exception:
        new_findings = []
        new_risk = {"score": 100.0, "risk_level": "LOW", "critical": 0, "high": 0, "medium": 0, "low": 0}

    # 4. Compare findings (New vs Resolved vs Unchanged)
    old_rule_map = {f.get("rule_id"): f for f in old_findings}
    new_rule_map = {f.get("rule_id"): f for f in new_findings}

    new_findings_list = []
    resolved_findings_list = []
    unchanged_findings_list = []

    for r_id, f in new_rule_map.items():
        if r_id not in old_rule_map:
            new_findings_list.append(f)
        else:
            unchanged_findings_list.append(f)

    for r_id, f in old_rule_map.items():
        if r_id not in new_rule_map:
            resolved_findings_list.append(f)

    compliance_before = float(old_risk.get("score", 100.0))
    compliance_after = float(new_risk.get("score", 100.0))
    score_difference = round(compliance_after - compliance_before, 2)

    # 5. Generate remediation recommendations for new findings
    remediation_engine = RemediationEngine()
    remediation_suggestions = remediation_engine.generate(
        [{"rule_id": f.get("rule_id"), "status": "FAIL", "title": f.get("title"), "severity": f.get("severity")} for f in new_findings_list],
        vendor=vendor
    )


    return {
        "device_id": device_id,
        "vendor": vendor,
        "old_version": old_version_label,
        "new_version": new_version_label,
        "added_lines": added_lines,
        "removed_lines": removed_lines,
        "modified_lines": modified_lines,
        "unchanged_lines": unchanged_lines,
        "total_changes": total_changes,
        "diff_view": diff_view,
        "security_impact": {
            "compliance_before": compliance_before,
            "compliance_after": compliance_after,
            "score_difference": score_difference,
            "risk_level_before": old_risk.get("risk_level", "LOW"),
            "risk_level_after": new_risk.get("risk_level", "LOW"),
            "new_findings": new_findings_list,
            "resolved_findings": resolved_findings_list,
            "unchanged_findings": unchanged_findings_list,
            "total_new_issues": len(new_findings_list),
            "total_resolved_issues": len(resolved_findings_list),
            "remediations": remediation_suggestions,
        }
    }
