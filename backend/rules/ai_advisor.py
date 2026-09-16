"""
AI advisor shim module.
"""
try:
    from backend.ai_engine.explainer import analyze_with_ai
except ImportError:
    from ai_engine.explainer import analyze_with_ai

__all__ = ["analyze_with_ai"]

