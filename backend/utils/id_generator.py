import uuid

def generate_id(prefix: str = "ID") -> str:
    """Generic ID generator used across the project."""
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def generate_scan_id():
    return generate_id("SCAN")

def generate_finding_id():
    return generate_id("FIND")

def generate_report_id():
    return generate_id("REP")
