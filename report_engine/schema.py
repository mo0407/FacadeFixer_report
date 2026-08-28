"""Validation for the renderer-neutral ReportDocument contract."""

from __future__ import annotations

from .chapter_mapping import section_index
from .status_rules import EVIDENCE_STATES, evidence_rule

REPORT_DOCUMENT_VERSION = "report-document/v1"


class ReportContractError(ValueError):
    pass


def _required(mapping, fields, name):
    if not isinstance(mapping, dict):
        raise ReportContractError("{} must be an object".format(name))
    missing = [field for field in fields if not mapping.get(field)]
    if missing:
        raise ReportContractError("{} misses required fields: {}".format(name, ", ".join(missing)))


def _field_metadata(fields):
    for field in fields:
        _required(field, ("path", "source_object", "period", "version", "required", "missing_phrase"), "field metadata")
        if not isinstance(field["required"], bool):
            raise ReportContractError("field metadata required must be boolean")


def _evidence(item):
    _required(item, ("evidence_id", "state", "source", "period", "version"), "evidence")
    if item["state"] not in EVIDENCE_STATES:
        raise ReportContractError("Unknown evidence state: {}".format(item["state"]))
    if item["state"] in {"not_collected", "inaccessible"} and not item.get("reason"):
        raise ReportContractError("{} evidence requires reason".format(item["state"]))
    if item.get("kind") == "image" and not item.get("approved_redaction"):
        raise ReportContractError("image evidence must be approved for redaction")


def validate_report_document(document):
    _required(document, ("schema_version", "report_id", "report_version", "frozen_at", "project", "field_catalog", "sections", "defects"), "ReportDocument")
    if document["schema_version"] != REPORT_DOCUMENT_VERSION:
        raise ReportContractError("Unsupported ReportDocument schema_version")
    project = document["project"]
    _required(project, ("project_id", "name", "period", "source_version"), "project")
    _field_metadata(document["field_catalog"])
    expected = [item["id"] for item in section_index()]
    actual = [item.get("id") for item in document["sections"]]
    if actual != expected:
        raise ReportContractError("sections must use the canonical report chapter order")
    for defect in document["defects"]:
        _required(defect, ("defect_id", "building_id", "facade_id", "category_id", "expert_conclusion", "evidence"), "defect")
        conclusion = defect["expert_conclusion"]
        _required(conclusion, ("status", "frozen_at", "source_version"), "expert_conclusion")
        if conclusion["status"] != "frozen":
            raise ReportContractError("only frozen expert conclusions may enter a report")
        for item in defect["evidence"]:
            _evidence(item)
    return document


def measured_defect_count(document):
    return sum(1 for defect in document["defects"] if any(evidence_rule(item["state"])["counts_as_measured"] for item in defect["evidence"]))

