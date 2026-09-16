import re

def sanitize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_hostname(hostname: str) -> str:
    return hostname.strip().replace('"', "")


def severity_color(level: str) -> str:
    colors = {
        "Critical": "#DC2626",
        "High": "#EA580C",
        "Medium": "#D97706",
        "Low": "#16A34A",
    }
    return colors.get(level, "#64748B")
