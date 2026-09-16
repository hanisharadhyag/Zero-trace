"""
Alias module for ConfigNormalizer.
Allows importing ConfigNormalizer from parsers.normalizer.
"""

from .config_normalizer import ConfigNormalizer, normalize_config

__all__ = ["ConfigNormalizer", "normalize_config"]
