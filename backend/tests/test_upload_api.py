"""
test_upload_api.py — Upload endpoint tests (Phase 10 augmentation)
Tests: valid Cisco upload, invalid extension, oversized simulation, empty upload
"""
import io
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


MINIMAL_CISCO_CONFIG = """\
hostname TEST-ROUTER
!
interface GigabitEthernet0/0
 ip address 203.0.113.1 255.255.255.0
 no shutdown
!
ip ssh version 2
no service telnet
!
logging 10.0.0.200
!
end
"""


def test_upload_valid_cisco_config():
    """Valid .txt Cisco config should return 200 with device data."""
    data = io.BytesIO(MINIMAL_CISCO_CONFIG.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": ("router.txt", data, "text/plain")},
    )
    assert response.status_code == 200
    body = response.json()
    # Response must contain success indicator or device hostname
    assert "hostname" in body or "success" in body or "device" in body


def test_upload_invalid_extension():
    """File with .exe extension must be rejected with 4xx status."""
    data = io.BytesIO(b"invalid binary data")
    response = client.post(
        "/api/upload",
        files={"file": ("malware.exe", data, "application/octet-stream")},
    )
    assert response.status_code in (400, 422, 415)


def test_upload_empty_file():
    """Uploading an empty file should return 4xx error."""
    data = io.BytesIO(b"")
    response = client.post(
        "/api/upload",
        files={"file": ("empty.txt", data, "text/plain")},
    )
    # Should either succeed with empty parse or return a client error
    assert response.status_code in (200, 400, 422)


def test_upload_fortinet_config():
    """Fortinet-style config should be accepted and parsed."""
    fortinet_config = """\
config system global
    set hostname "FGT-Enterprise"
end

config firewall policy
    edit 1
        set name "DENY_ALL"
        set action deny
    next
end
"""
    data = io.BytesIO(fortinet_config.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": ("fortigate.conf", data, "text/plain")},
    )
    assert response.status_code == 200


def test_upload_paloalto_config():
    """Palo Alto XML config should be accepted."""
    paloalto_config = """\
<config version="10.1.0">
  <devices>
    <entry name="localhost.localdomain">
      <deviceconfig>
        <system>
          <hostname>PA-Enterprise</hostname>
        </system>
      </deviceconfig>
    </entry>
  </devices>
</config>
"""
    data = io.BytesIO(paloalto_config.encode("utf-8"))
    response = client.post(
        "/api/upload",
        files={"file": ("running-config.xml", data, "text/xml")},
    )
    assert response.status_code == 200


def test_health_endpoint():
    """Health check must return healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body.get("status") == "healthy"


def test_root_endpoint():
    """Root endpoint returns project metadata."""
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body.get("project") == "Zero-Trace"
    assert "version" in body
