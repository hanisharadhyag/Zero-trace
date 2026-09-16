from pathlib import Path

ALLOWED = {".txt", ".conf", ".cfg", ".xml"}

MAX_SIZE_MB = 25


def validate_extension(filename: str):
    return Path(filename).suffix.lower() in ALLOWED


def validate_size(size_bytes: int):
    return size_bytes <= MAX_SIZE_MB * 1024 * 1024
