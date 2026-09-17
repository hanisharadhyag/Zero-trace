"""
File Integrity Service (SHA-256 Hash Verification)
Zero-Trace Network Security Auditor
"""

import hashlib
from pathlib import Path
from typing import Tuple
from database import ConfigFileModel

def compute_sha256(content: bytes) -> str:
    """Calculate SHA-256 hash of raw byte content."""
    return hashlib.sha256(content).hexdigest()

def verify_file_integrity(file_record: ConfigFileModel) -> Tuple[bool, str, str]:
    """
    Verifies that the physical file on disk matches its recorded SHA-256 hash.
    Returns: (is_valid: bool, actual_hash: str, error_message: str)
    """
    file_path = Path(file_record.file_path)
    if not file_path.exists():
        return False, "", f"File does not exist on disk: {file_record.file_path}"

    try:
        content = file_path.read_bytes()
        actual_hash = compute_sha256(content)
        
        if actual_hash != file_record.sha256_hash:
            return False, actual_hash, f"Integrity mismatch for file ID {file_record.id}. Expected {file_record.sha256_hash}, calculated {actual_hash}"
            
        return True, actual_hash, "Integrity verified successfully"
    except Exception as e:
        return False, "", f"Error reading file for integrity check: {str(e)}"
