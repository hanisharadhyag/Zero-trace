from pathlib import Path
from typing import Optional


class FileReader:
    """
    Utility class for reading configuration files.
    """

    SUPPORTED_EXTENSIONS = [
        ".txt",
        ".conf",
        ".cfg",
        ".xml"
    ]

    @staticmethod
    def read(path: str) -> str:
        """
        Read file and return its contents.
        """

        # Try resolving relative to CWD, then backend directory, then file directory
        candidates = [
            Path(path),
            Path(path.strip()),
            Path(path.rstrip() + " "),
            Path(__file__).resolve().parent.parent / path,
            Path(__file__).resolve().parent.parent / path.strip(),
            Path(__file__).resolve().parent.parent / (path.rstrip() + " "),
            Path(__file__).resolve().parent.parent.parent / path,
            Path(__file__).resolve().parent.parent.parent / path.strip(),
        ]

        resolved_path = None
        for candidate in candidates:
            if candidate.is_file():
                resolved_path = candidate
                break

        # If still not found, search in parent directory for matching basename without trailing space
        if not resolved_path:
            p = Path(path)
            for parent_candidate in [Path("."), Path("backend"), Path(__file__).resolve().parent.parent]:
                target_dir = parent_candidate / p.parent
                if target_dir.is_dir():
                    for f in target_dir.iterdir():
                        if f.name.strip() == p.name.strip():
                            resolved_path = f
                            break
                if resolved_path:
                    break

        if not resolved_path or not resolved_path.exists():
            raise FileNotFoundError(
                f"{path} not found."
            )

        suffix = resolved_path.suffix.strip().lower()
        if suffix not in FileReader.SUPPORTED_EXTENSIONS:
            raise ValueError("Unsupported file format.")

        return resolved_path.read_text(
            encoding="utf-8",
            errors="ignore"
        )

    @staticmethod
    def extension(path: str) -> str:

        return Path(path).suffix.lower()

    @staticmethod
    def filename(path: str) -> str:

        return Path(path).name

    @staticmethod
    def size(path: str) -> Optional[int]:

        file_path = Path(path)

        if file_path.exists():
            return file_path.stat().st_size

        return None
