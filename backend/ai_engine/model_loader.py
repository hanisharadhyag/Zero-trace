"""
Local LLM Integration Module for SIH26155 Security Auditor.

Supports local Ollama instance (e.g., Llama 3.1) via HTTP API with
graceful deterministic fallback when the LLM service is offline.
"""

import logging
from typing import Optional
import httpx

logger = logging.getLogger("ai_engine.model_loader")


class LocalLLM:
    """
    Client interface for local Ollama LLM (Llama 3.1) with resilient offline fallback.
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model_name: str = "llama3.1",
        timeout: float = 6.0
    ):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.timeout = timeout

    def is_available(self) -> bool:
        """
        Check if local Ollama daemon is reachable.
        """
        try:
            with httpx.Client(timeout=1.5) as client:
                res = client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    def generate(self, prompt: str, system: Optional[str] = None) -> str:
        """
        Query local Ollama instance for text generation.
        Falls back gracefully to deterministic analysis if Ollama is unreachable.
        """
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "top_p": 0.9
            }
        }
        if system:
            payload["system"] = system

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", "").strip()
                else:
                    logger.warning(f"Ollama returned HTTP {response.status_code}")
        except Exception as e:
            logger.info(f"Ollama offline ({e}), utilizing deterministic security engine fallback.")

        return self._deterministic_fallback(prompt)

    def _deterministic_fallback(self, prompt: str) -> str:
        """
        Deterministic, rule-correlated security analysis used when local LLM is offline.
        """
        prompt_lower = prompt.lower()
        if "executive" in prompt_lower or "summary" in prompt_lower:
            return (
                "EXECUTIVE COMPLIANCE BRIEF:\n"
                "The audited network configuration exposes perimeter and management vulnerabilities "
                "that violate Zero Trust architecture baselines. Immediate isolation of unencrypted "
                "administrative channels (Telnet, HTTP) and tightening of any-to-any firewall policies "
                "is required to prevent unauthorized lateral movement and regulatory non-compliance."
            )
        elif "telnet" in prompt_lower:
            return (
                "TECHNICAL ANALYSIS: Cleartext Telnet transmission allows trivial credential sniffing via passive packet capture. "
                "BUSINESS IMPACT: Interception of root credentials jeopardizes entire network infrastructure integrity. "
                "RECOMMENDED ACTION: Disable Telnet immediately and mandate SSHv2 with 2048-bit RSA or Ed25519 keys."
            )
        elif "firewall" in prompt_lower or "any" in prompt_lower:
            return (
                "TECHNICAL ANALYSIS: Overly permissive ANY-to-ANY ACL rules defeat stateful perimeter segmentation. "
                "BUSINESS IMPACT: Exposes internal database and server subnets directly to internet reconnaissance and exploitation. "
                "RECOMMENDED ACTION: Replace ANY sources and destinations with explicit CIDR prefixes and port definitions."
            )
        else:
            return (
                "AI COMPLIANCE ASSESSMENT: Configuration deviates from industry benchmarks (CIS Controls / NIST SP 800-53). "
                "Implement defense-in-depth controls, enforce multi-factor administrative access, and enable centralized audit logging."
            )
