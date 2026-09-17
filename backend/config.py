"""
Central Configuration
SIH26155 - AI Driven Multi-Vendor Network Security Compliance Auditor
"""

from pathlib import Path

# ==========================================================
# Project Directories
# ==========================================================

ROOT_DIR = Path(__file__).resolve().parent

DATA_DIR = ROOT_DIR / "data"
UPLOAD_DIR = ROOT_DIR / "uploads"
REPORT_DIR = ROOT_DIR / "reports"
LOG_DIR = ROOT_DIR / "logs"
TEMP_DIR = ROOT_DIR / "temp"

PROTECTED_STORAGE_DIR = ROOT_DIR / "protected_storage"

# Create folders automatically
for folder in [DATA_DIR, UPLOAD_DIR, REPORT_DIR, LOG_DIR, TEMP_DIR, PROTECTED_STORAGE_DIR]:
    folder.mkdir(exist_ok=True)

# ==========================================================
# Authentication & Security Configuration
# ==========================================================

JWT_SECRET_KEY = "zero_trace_super_secret_jwt_key_sih2026_enterprise"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours


# ==========================================================
# Database
# ==========================================================

DATABASE_NAME = "network_security.db"
DATABASE_PATH = DATA_DIR / DATABASE_NAME

# ==========================================================
# Upload Configuration
# ==========================================================

MAX_UPLOAD_SIZE_MB = 25

SUPPORTED_EXTENSIONS = {
    ".txt": "cisco",
    ".conf": "fortinet",
    ".xml": "paloalto"
}

SUPPORTED_VENDORS = [
    "cisco",
    "fortinet",
    "paloalto"
]

# ==========================================================
# AI Configuration
# ==========================================================

AI_ENABLED = True
DEFAULT_MODEL = "llama3.1"
OLLAMA_HOST = "http://localhost:11434"

# ==========================================================
# Security Scoring
# ==========================================================

MAX_SECURITY_SCORE = 100

SEVERITY_WEIGHTS = {
    "Critical": 10,
    "High": 7,
    "Medium": 4,
    "Low": 1
}

# ==========================================================
# Risk Levels
# ==========================================================

RISK_LEVELS = {
    (90, 100): "Excellent",
    (75, 89): "Good",
    (50, 74): "Moderate",
    (25, 49): "High",
    (0, 24): "Critical"
}

# ==========================================================
# API Configuration
# ==========================================================

API_TITLE = "SIH26155 AI Network Security Auditor"
API_VERSION = "1.0.0"

# ==========================================================
# Report Configuration
# ==========================================================

PDF_REPORT_NAME = "Security_Audit_Report.pdf"

# ==========================================================
# Visualization Colors
# ==========================================================

SEVERITY_COLORS = {
    "Critical": "#ef4444",
    "High": "#f97316",
    "Medium": "#facc15",
    "Low": "#22c55e"
}
