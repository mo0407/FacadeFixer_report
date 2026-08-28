"""Versioned report-domain contract for Issue #79.

This package deliberately has no dependency on the current API, database, UI or
DOCX renderer.  Rendering tasks consume its ``ReportDocument`` dictionary.
"""

from .mapping import build_report_document
from .schema import REPORT_DOCUMENT_VERSION, ReportContractError, validate_report_document

__all__ = ["REPORT_DOCUMENT_VERSION", "ReportContractError", "build_report_document", "validate_report_document"]

