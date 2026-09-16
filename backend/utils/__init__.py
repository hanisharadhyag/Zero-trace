from .file_reader import FileReader
from .logger import get_logger

from .helpers import (
    sanitize_text,
    normalize_hostname,
    severity_color,
)

from .vendor_detector import detect_vendor

from .id_generator import (
    generate_id,
    generate_scan_id,
    generate_finding_id,
    generate_report_id,
)

from .validators import (
    validate_extension,
    validate_size,
)

from .report_utils import (
    current_timestamp,
    calculate_pass_rate,
)

# NEW
from .chart_generator import ChartGenerator

__all__ = [
    "FileReader",
    "get_logger",
    "detect_vendor",
    "sanitize_text",
    "normalize_hostname",
    "severity_color",
    "generate_id",
    "generate_scan_id",
    "generate_finding_id",
    "generate_report_id",
    "validate_extension",
    "validate_size",
    "current_timestamp",
    "calculate_pass_rate",
    "ChartGenerator",
]
