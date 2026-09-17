"""
Database Layer for SIH26155 Network Security Compliance Auditor.

SQLite + SQLAlchemy ORM
- Devices
- Findings
- Audit Reports
- Remediation History
- Security Scores
"""

import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ---------------------------------------------------------------------
# Database Configuration
# ---------------------------------------------------------------------

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "network_security.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

# ---------------------------------------------------------------------
# ORM MODELS
# ---------------------------------------------------------------------


class DeviceModel(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True, default="Unknown")
    vendor = Column(String, default="Generic")
    device_type = Column(String, default="Router")
    os_version = Column(String)
    management_ip = Column(String)
    raw_config = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class FindingModel(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)

    finding_id = Column(String, index=True)
    title = Column(String)
    severity = Column(String)
    category = Column(String, default="Compliance")

    description = Column(Text)
    remediation = Column(Text)

    device = Column(String)
    risk_points = Column(Integer, default=0)
    status = Column(String, default="Open")
    scan_id = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)


class AuditReportModel(Base):
    __tablename__ = "audit_reports"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(String, unique=True, index=True)

    hostname = Column(String)
    vendor = Column(String)

    score = Column(Float)
    risk_level = Column(String)

    total_rules = Column(Integer, default=15)
    passed_rules = Column(Integer, default=0)
    failed_rules = Column(Integer, default=0)

    report_data = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)


class RemediationHistoryModel(Base):
    __tablename__ = "remediation_history"

    id = Column(Integer, primary_key=True, index=True)

    rule_id = Column(String)
    device_hostname = Column(String)

    action_taken = Column(String)
    commands_executed = Column(Text)

    status = Column(String, default="Pending")

    timestamp = Column(DateTime, default=datetime.utcnow)


class SecurityScoreModel(Base):
    __tablename__ = "security_scores"

    id = Column(Integer, primary_key=True, index=True)

    device_hostname = Column(String, index=True)

    score = Column(Float)
    risk_level = Column(String)

    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)

    scan_timestamp = Column(DateTime, default=datetime.utcnow)


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Security Analyst")  # Admin, Security Analyst, Viewer, Guest
    project_id = Column(Integer, default=1, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class ConfigFileModel(Base):
    __tablename__ = "config_files"

    id = Column(Integer, primary_key=True, index=True)
    device_hostname = Column(String, index=True, nullable=False)
    vendor = Column(String, nullable=False)
    version_label = Column(String, nullable=False, default="v1")
    file_path = Column(String, nullable=False)
    sha256_hash = Column(String, nullable=False)

    project_id = Column(Integer, index=True, nullable=False)
    uploaded_by = Column(Integer, nullable=False)
    uploaded_by_username = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    username = Column(String, nullable=False)
    project_id = Column(Integer, index=True, nullable=False)
    file_id = Column(Integer, nullable=True)

    action = Column(String, index=True, nullable=False) # upload, view, download, analyze, compare, delete, failed_auth, integrity_mismatch
    result = Column(String, nullable=False)            # ALLOWED, DENIED, ERROR
    reason = Column(Text, nullable=False)

    timestamp = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------
# Initialization
# ---------------------------------------------------------------------


def init_database():
    """Create database tables during application startup and seed initial project/users."""
    Base.metadata.create_all(bind=engine)
    
    # Seed default project & users if missing
    db = SessionLocal()
    try:
        if not db.query(ProjectModel).filter(ProjectModel.id == 1).first():
            db.add(ProjectModel(id=1, name="Default Enterprise Network", description="Primary production network security monitoring project"))
            db.commit()

        if not db.query(ProjectModel).filter(ProjectModel.id == 2).first():
            db.add(ProjectModel(id=2, name="Secondary Isolated Network", description="Isolated testing network project for isolation tests"))
            db.commit()

        # Simple seed password hash helper to avoid circular imports during init
        import hashlib
        def _quick_hash(pwd: str) -> str:
            return hashlib.sha256(f"salt_zerotrace_2026_{pwd}".encode()).hexdigest()

        seed_users = [
            ("admin@zerotrace.ai", "admin", _quick_hash("admin123"), "Admin", 1),
            ("analyst@zerotrace.ai", "analyst", _quick_hash("analyst123"), "Security Analyst", 1),
            ("viewer@zerotrace.ai", "viewer", _quick_hash("viewer123"), "Viewer", 1),
            ("guest@zerotrace.ai", "guest", _quick_hash("guest123"), "Guest", 1),
            ("other_user@zerotrace.ai", "other_analyst", _quick_hash("other123"), "Security Analyst", 2),
        ]

        for email, uname, hpwd, role, pid in seed_users:
            if not db.query(UserModel).filter(UserModel.email == email).first():
                db.add(UserModel(email=email, username=uname, hashed_password=hpwd, role=role, project_id=pid))
        db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()



# Create immediately if file doesn't exist
init_database()

# ---------------------------------------------------------------------
# FastAPI Dependency
# ---------------------------------------------------------------------


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------
# Database Manager
# ---------------------------------------------------------------------


class DatabaseManager:
    """Unified database wrapper used across backend."""

    def __init__(self):
        init_database()

    def get_session(self) -> Session:
        return SessionLocal()

    def create_tables(self):
        init_database()

    # ---------------- DEVICES ----------------

    def save_device(self, device):
        db = self.get_session()

        try:
            record = DeviceModel(
                hostname=getattr(device, "hostname", "Unknown"),
                vendor=getattr(device, "vendor", "Cisco"),
                device_type=getattr(device, "device_type", "Router"),
                os_version=getattr(device, "os_version", None),
                management_ip=getattr(device, "management_ip", None),
                raw_config=getattr(device, "raw_config", None),
            )

            db.add(record)
            db.commit()
            db.refresh(record)

            return record

        finally:
            db.close()

    def get_devices(self) -> List[Dict]:
        db = self.get_session()

        try:
            devices = db.query(DeviceModel).all()

            return [
                {
                    "id": d.id,
                    "hostname": d.hostname,
                    "vendor": d.vendor,
                    "device_type": d.device_type,
                    "os_version": d.os_version,
                    "management_ip": d.management_ip,
                    "created_at": d.created_at.isoformat(),
                }
                for d in devices
            ]

        finally:
            db.close()

    # ---------------- FINDINGS ----------------

    def save_findings(self, findings, scan_id=None):
        db = self.get_session()

        try:
            for f in findings:
                if isinstance(f, dict):
                    record = FindingModel(
                        finding_id=f.get("rule_id", "R00"),
                        title=f.get("title", "Issue"),
                        severity=f.get("severity", "Medium"),
                        category=f.get("category", "Compliance"),
                        description=f.get(
                            "description",
                            f.get("message", ""),
                        ),
                        remediation=f.get(
                            "recommendation",
                            f.get("remediation", ""),
                        ),
                        device=f.get(
                            "affected_device",
                            f.get("device", "Unknown"),
                        ),
                        risk_points=f.get("risk_points", 0),
                        status=f.get("status", "Open"),
                        scan_id=scan_id,
                    )
                else:
                    record = FindingModel(
                        finding_id=f.id,
                        title=f.title,
                        severity=f.severity,
                        category=f.category,
                        description=f.description,
                        remediation=f.remediation,
                        device=f.affected_device,
                        risk_points=f.risk_points,
                        status=f.status,
                        scan_id=scan_id,
                    )

                db.add(record)

            db.commit()

        finally:
            db.close()

    def get_findings(self) -> List[Dict]:
        db = self.get_session()

        try:
            findings = db.query(FindingModel).all()

            return [
                {
                    "id": f.finding_id,
                    "db_id": f.id,
                    "title": f.title,
                    "severity": f.severity,
                    "category": f.category,
                    "description": f.description,
                    "remediation": f.remediation,
                    "device": f.device,
                    "risk_points": f.risk_points,
                    "status": f.status,
                    "created_at": f.created_at.isoformat(),
                }
                for f in findings
            ]

        finally:
            db.close()

    # ---------------- REPORTS ----------------

    def save_audit_report(self, report):
        import uuid

        db = self.get_session()

        try:
            report_id = report.get("report_id") or f"AUDIT-{uuid.uuid4().hex[:8]}"

            summary = report.get("summary", {})
            device = report.get("device", {})

            db.add(
                AuditReportModel(
                    report_id=report_id,
                    hostname=device.get("hostname", "Unknown"),
                    vendor=device.get("vendor", "Generic"),
                    score=summary.get("score", 0),
                    risk_level=summary.get("risk_level", "HIGH"),
                    total_rules=summary.get("total_rules", 15),
                    passed_rules=summary.get("passed", 0),
                    failed_rules=summary.get("failed", 0),
                    report_data=json.dumps(report),
                )
            )

            db.commit()

            return report_id

        finally:
            db.close()

    def get_audit_reports(self):
        db = self.get_session()

        try:
            reports = (
                db.query(AuditReportModel)
                .order_by(AuditReportModel.created_at.desc())
                .all()
            )

            return [
                {
                    "report_id": r.report_id,
                    "hostname": r.hostname,
                    "vendor": r.vendor,
                    "score": r.score,
                    "risk_level": r.risk_level,
                    "passed": r.passed_rules,
                    "failed": r.failed_rules,
                    "created_at": r.created_at.isoformat(),
                }
                for r in reports
            ]

        finally:
            db.close()

    # ---------------- SECURITY SCORE ----------------

    def save_security_score(self, hostname, score_data):
        db = self.get_session()

        try:
            db.add(
                SecurityScoreModel(
                    device_hostname=hostname,
                    score=score_data.get("score", 0),
                    risk_level=score_data.get("risk_level", "HIGH"),
                    critical_count=score_data.get("critical", 0),
                    high_count=score_data.get("high", 0),
                    medium_count=score_data.get("medium", 0),
                    low_count=score_data.get("low", 0),
                )
            )

            db.commit()

        finally:
            db.close()

    # ---------------- REMEDIATION ----------------

    def save_remediation(
        self,
        rule_id,
        hostname,
        action,
        commands,
        status="Pending",
    ):
        db = self.get_session()

        try:
            db.add(
                RemediationHistoryModel(
                    rule_id=rule_id,
                    device_hostname=hostname,
                    action_taken=action,
                    commands_executed=commands,
                    status=status,
                )
            )

            db.commit()

        finally:
            db.close()

    # ---------------- USERS & AUTH ----------------

    def get_user_by_email(self, email: str) -> Optional[UserModel]:
        db = self.get_session()
        try:
            return db.query(UserModel).filter(UserModel.email == email.strip().lower()).first()
        finally:
            db.close()

    def get_user_by_id(self, user_id: int) -> Optional[UserModel]:
        db = self.get_session()
        try:
            return db.query(UserModel).filter(UserModel.id == user_id).first()
        finally:
            db.close()

    # ---------------- CONFIG FILES ----------------

    def save_config_file(
        self,
        device_hostname: str,
        vendor: str,
        version_label: str,
        file_path: str,
        sha256_hash: str,
        project_id: int,
        uploaded_by: int,
        uploaded_by_username: str,
    ) -> ConfigFileModel:
        db = self.get_session()
        try:
            file_rec = ConfigFileModel(
                device_hostname=device_hostname,
                vendor=vendor,
                version_label=version_label,
                file_path=file_path,
                sha256_hash=sha256_hash,
                project_id=project_id,
                uploaded_by=uploaded_by,
                uploaded_by_username=uploaded_by_username,
            )
            db.add(file_rec)
            db.commit()
            db.refresh(file_rec)
            return file_rec
        finally:
            db.close()

    def get_config_file(self, file_id: int) -> Optional[ConfigFileModel]:
        db = self.get_session()
        try:
            return db.query(ConfigFileModel).filter(ConfigFileModel.id == file_id).first()
        finally:
            db.close()

    def get_config_files_by_project(self, project_id: int) -> List[ConfigFileModel]:
        db = self.get_session()
        try:
            return db.query(ConfigFileModel).filter(ConfigFileModel.project_id == project_id).order_by(ConfigFileModel.created_at.desc()).all()
        finally:
            db.close()

    def get_config_files_by_hostname(self, project_id: int, hostname: str) -> List[ConfigFileModel]:
        db = self.get_session()
        try:
            return (
                db.query(ConfigFileModel)
                .filter(ConfigFileModel.project_id == project_id, ConfigFileModel.device_hostname == hostname)
                .order_by(ConfigFileModel.created_at.asc())
                .all()
            )
        finally:
            db.close()

    def delete_config_file(self, file_id: int):
        db = self.get_session()
        try:
            file_rec = db.query(ConfigFileModel).filter(ConfigFileModel.id == file_id).first()
            if file_rec:
                db.delete(file_rec)
                db.commit()
        finally:
            db.close()

    # ---------------- AUDIT LOGS ----------------

    def save_audit_log(
        self,
        user_id: int,
        username: str,
        project_id: int,
        file_id: Optional[int],
        action: str,
        result: str,
        reason: str,
    ) -> AuditLogModel:
        db = self.get_session()
        try:
            log_rec = AuditLogModel(
                user_id=user_id,
                username=username,
                project_id=project_id,
                file_id=file_id,
                action=action,
                result=result,
                reason=reason,
            )
            db.add(log_rec)
            db.commit()
            db.refresh(log_rec)
            return log_rec
        finally:
            db.close()

    def get_audit_logs(self, project_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        db = self.get_session()
        try:
            logs = (
                db.query(AuditLogModel)
                .filter(AuditLogModel.project_id == project_id)
                .order_by(AuditLogModel.timestamp.desc())
                .limit(limit)
                .all()
            )
            return [
                {
                    "id": l.id,
                    "user_id": l.user_id,
                    "username": l.username,
                    "project_id": l.project_id,
                    "file_id": l.file_id,
                    "action": l.action,
                    "result": l.result,
                    "reason": l.reason,
                    "timestamp": l.timestamp.isoformat(),
                }
                for l in logs
            ]
        finally:
            db.close()

