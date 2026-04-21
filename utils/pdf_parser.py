import fitz  # PyMuPDF
import os


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts raw text from a PDF file.
    """
    try:
        doc = fitz.open(pdf_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        return full_text
    except Exception as e:
        print(f"⚠️ PDF Parse Error: {e}")
        return ""
