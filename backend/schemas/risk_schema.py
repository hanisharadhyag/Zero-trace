from pydantic import BaseModel


class SecuritySummarySchema(BaseModel):
    score: int

    grade: str

    risk_level: str

    passed_rules: int

    failed_rules: int


class RiskSchema(BaseModel):
    security_score: int

    grade: str

    risk_level: str

    critical: int

    high: int

    medium: int

    low: int

    total_findings: int
