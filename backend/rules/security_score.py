"""
Security score shim module.
"""
from backend.engine.risk_score import calculate_security_score, RiskScoreEngine

__all__ = ["calculate_security_score", "RiskScoreEngine"]
