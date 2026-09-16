"""
Central Cybersecurity Audit Engine for SIH6155 Auditor.

Primary entrypoint for executing all cybersecurity compliance checks,
output normalization, scoring, risk prioritization,
structured remediations, and local AI correlation.
"""

from typing import Dict, Any, List

from parsers.normalizer import normalize_config
from engine.security_rules import run_all_rules
from engine.risk_score import RiskScoreEngine
from engine.prioritization import prioritize_risks
from engine.remediation import (
    get_remediation_plan,
    REMEDIATION_CATALOG,
)
from ai_engine.explainer import analyze_with_ai


# Initialize risk engine once
risk_engine = RiskScoreEngine()


def run_security_audit(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute complete cybersecurity compliance audit against network configuration.

    Returns:
        {
            results,
            summary,
            prioritized_risks,
            remediations,
            ai_analysis
        }
    """

    # 1. Normalize configuration
    norm_config = normalize_config(config)

    # 2. Execute all security rules
    raw_results = run_all_rules(norm_config)

    # 3. Normalize outputs
    vendor = norm_config.get("device", {}).get("vendor", "Generic")
    enriched_results = _normalize_rule_results(raw_results, vendor)

    # 4. Calculate enterprise risk score
    summary = risk_engine.calculate(enriched_results)

    # 5. Prioritize failed findings
    prioritized = prioritize_risks(enriched_results)

    # 6. Generate remediation plan
    remediations = get_remediation_plan(
        enriched_results,
        vendor=vendor,
    )

    # 7. Local AI explanation layer
    ai_analysis = analyze_with_ai(
        norm_config,
        enriched_results,
        prioritized,
    )

    return {
        "results": enriched_results,
        "summary": summary,
        "prioritized_risks": prioritized,
        "remediations": remediations,
        "ai_analysis": ai_analysis,
    }


def _normalize_rule_results(
    results: List[Dict[str, Any]],
    vendor: str,
) -> List[Dict[str, Any]]:
    """
    Standardize every rule output into one enterprise format.
    """

    normalized = []

    for res in results:

        if not isinstance(res, dict):
            continue

        item = dict(res)

        rule_id = item.get("rule_id", "R00")
        catalog = REMEDIATION_CATALOG.get(rule_id, {})

        # Keep message & description synchronized
        if "message" not in item and "description" in item:
            item["message"] = item["description"]

        if "description" not in item and "message" in item:
            item["description"] = item["message"]

        # Recommendation
        if "recommendation" not in item:

            if item.get("status") == "FAIL":
                item["recommendation"] = catalog.get(
                    "recommended_action",
                    "Remediate non-compliant configuration.",
                )
            else:
                item["recommendation"] = (
                    "No remediation required."
                )

        # Evidence / Details
        if "details" not in item:

            if "conflicts" in item:
                item["details"] = item["conflicts"]

            elif "deviations" in item:
                item["details"] = item["deviations"]

            else:
                item["details"] = item.get("message", "")

        normalized.append(item)

    return normalized
