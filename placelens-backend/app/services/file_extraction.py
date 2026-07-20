import io

from docx import Document
from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(text_parts).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in document.paragraphs).strip()


def extract_resume_text(file_bytes: bytes, content_type: str, file_name: str) -> str:
    lower_name = file_name.lower()

    if content_type == "application/pdf" or lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)

    if (
        content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or lower_name.endswith(".docx")
    ):
        return extract_text_from_docx(file_bytes)

    try:
        return file_bytes.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""
