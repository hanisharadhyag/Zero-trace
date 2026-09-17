"""
Automated Tests for Zero Trust File Access, RBAC, Project Isolation, & Audit Logging
Zero-Trace Network Security Auditor
"""

import pytest
from database import DatabaseManager, ConfigFileModel, UserModel
from security.rbac import has_permission, can_access_file
from security.sanitizer import sanitize_config
from services.integrity_service import compute_sha256, verify_file_integrity
from services.audit_service import log_audit_event, get_project_audit_logs


def setup_fake_db():
    db_mgr = DatabaseManager()
    return db_mgr


def test_rbac_matrix_permissions():
    admin = UserModel(id=1, role="Admin", project_id=1)
    analyst = UserModel(id=2, role="Security Analyst", project_id=1)
    viewer = UserModel(id=3, role="Viewer", project_id=1)
    guest = UserModel(id=4, role="Guest", project_id=1)

    # Admin checks
    assert has_permission(admin, "upload") is True
    assert has_permission(admin, "download") is True
    assert has_permission(admin, "delete") is True
    assert has_permission(admin, "compare") is True

    # Analyst checks
    assert has_permission(analyst, "upload") is True
    assert has_permission(analyst, "compare") is True
    assert has_permission(analyst, "download") is False
    assert has_permission(analyst, "delete") is False

    # Viewer checks
    assert has_permission(viewer, "view") is True
    assert has_permission(viewer, "download") is False
    assert has_permission(viewer, "upload") is False
    assert has_permission(viewer, "delete") is False

    # Guest checks
    assert has_permission(guest, "view") is False
    assert has_permission(guest, "upload") is False
    assert has_permission(guest, "compare") is False


def test_project_isolation_cross_project_denied():
    user_proj1 = UserModel(id=1, role="Admin", project_id=1)
    file_proj2 = ConfigFileModel(id=101, project_id=2, file_path="/fake/path", sha256_hash="abc")

    # Accessing file from another project MUST be denied (404/Not Found or Access Denied)
    allowed, status_code, reason = can_access_file(user_proj1, file_proj2, "view")
    assert allowed is False
    assert status_code == 404
    assert "not found" in reason.lower() or "denied" in reason.lower()


def test_project_isolation_same_project_allowed():
    user_proj1 = UserModel(id=1, role="Admin", project_id=1)
    file_proj1 = ConfigFileModel(id=102, project_id=1, file_path="/fake/path", sha256_hash="abc")

    allowed, status_code, reason = can_access_file(user_proj1, file_proj1, "view")
    assert allowed is True
    assert status_code == 200


def test_file_integrity_verification(tmp_path):
    # Write a test file
    test_file = tmp_path / "router.conf"
    content = b"hostname Router-01\npassword Secret123"
    test_file.write_bytes(content)

    correct_hash = compute_sha256(content)
    file_rec = ConfigFileModel(id=201, file_path=str(test_file), sha256_hash=correct_hash)

    # 1. Valid integrity check
    valid, actual, msg = verify_file_integrity(file_rec)
    assert valid is True
    assert actual == correct_hash

    # 2. Tamper file content (Integrity mismatch)
    test_file.write_bytes(b"hostname Router-01\npassword TAMPERED")
    valid_tampered, actual_tampered, msg_tampered = verify_file_integrity(file_rec)
    assert valid_tampered is False
    assert actual_tampered != correct_hash
    assert "mismatch" in msg_tampered.lower()


def test_sensitive_data_sanitizer():
    raw_config = """hostname Core-Router
enable secret 5 $1$mERr$K.2
password SecretPass123
snmp-server community public RO
bearer token 9a8b7c6d
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.0
"""
    sanitized = sanitize_config(raw_config)

    # Raw secrets must be masked
    assert "SecretPass123" not in sanitized
    assert "public" not in sanitized
    assert "9a8b7c6d" not in sanitized
    assert "enable secret ********" in sanitized or "enable secret" in sanitized
    assert "snmp-server community ******** RO" in sanitized or "snmp-server community" in sanitized
    assert "ip address 10.0.0.1" in sanitized # Non-secret config preserved


def test_audit_logging():
    db_mgr = setup_fake_db()
    log_audit_event(
        user_id=1,
        username="analyst_test",
        project_id=1,
        file_id=101,
        action="drift_compare",
        result="ALLOWED",
        reason="Test drift comparison event",
    )

    logs = get_project_audit_logs(project_id=1, limit=5)
    assert len(logs) > 0
    latest = logs[0]
    assert latest["user_id"] == 1
    assert latest["username"] == "analyst_test"
    assert latest["action"] == "drift_compare"
    assert latest["result"] == "ALLOWED"
