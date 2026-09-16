"""
Compatibility shim package for rules modules.
Exports all cybersecurity engines, normalizers, rules, and advisors.
"""

try:
    from backend.engine.audit import run_security_audit
    from backend.parsers.config_normalizer import normalize_config
    from backend.engine.security_rules import run_all_rules, SecurityEngine
    from backend.engine.risk_score import calculate_security_score, RiskScoreEngine
    from backend.engine.prioritization import prioritize_risks, RiskPrioritizationEngine
    from backend.engine.remediation import get_remediation_plan, REMEDIATION_CATALOG, RemediationEngine
    from backend.ai_engine.explainer import analyze_with_ai
except ImportError:
    from engine.audit import run_security_audit
    from parsers.config_normalizer import normalize_config
    from engine.security_rules import run_all_rules, SecurityEngine
    from engine.risk_score import calculate_security_score, RiskScoreEngine
    from engine.prioritization import prioritize_risks, RiskPrioritizationEngine
    from engine.remediation import get_remediation_plan, REMEDIATION_CATALOG, RemediationEngine
    from ai_engine.explainer import analyze_with_ai

__all__ = [
    "run_security_audit",
    "normalize_config",
    "run_all_rules",
    "SecurityEngine",
    "calculate_security_score",
    "RiskScoreEngine",
    "prioritize_risks",
    "RiskPrioritizationEngine",
    "get_remediation_plan",
    "REMEDIATION_CATALOG",
    "RemediationEngine",
    "analyze_with_ai",
]
