import os
import uuid


def build_unique_filename(original_filename: str) -> str:
    safe_name = original_filename.replace("/", "_").replace("\\", "_")
    return f"{uuid.uuid4().hex}_{safe_name}"


def ensure_directory(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def bytes_to_kb(size_in_bytes: int) -> int:
    return max(1, size_in_bytes // 1024)
