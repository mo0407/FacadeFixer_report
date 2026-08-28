"""Explicit mapping from frozen domain snapshots; no database or renderer calls."""

from __future__ import annotations

from .chapter_mapping import section_index
from .schema import REPORT_DOCUMENT_VERSION, validate_report_document
from .status_rules import formal_statement


DEFAULT_FIELD_CATALOG = (
    ("project.name", "project", True, "项目名称未提供"),
    ("project.period", "inspection_period", True, "检测期次未提供"),
    ("defects[].expert_conclusion", "frozen_expert_conclusion", True, "待专家确认"),
    ("defects[].evidence", "approved_redacted_evidence", True, "未提供可用证据"),
)


def _catalog(snapshot):
    versions = snapshot["versions"]
    rows = []
    for path, source_object, required, phrase in DEFAULT_FIELD_CATALOG:
        rows.append({"path": path, "source_object": source_object, "period": snapshot["project"]["period"], "version": versions[source_object], "required": required, "missing_phrase": phrase})
    return rows


def _map_evidence(source):
    result = dict(source)
    # Keep mapper failures within the public report-contract error family.
    # Validation will also inspect the resulting evidence record.
    try:
        result["formal_statement"] = formal_statement(result["state"], result.get("reason"))
    except ValueError as error:
        from .schema import ReportContractError
        raise ReportContractError(str(error))
    return result


def build_report_document(snapshot):
    """Build a report from a frozen, approved input snapshot.

    The caller supplies only export-approved data.  This function rejects live
    / unfrozen decisions through ``validate_report_document``.
    """
    project = snapshot["project"]
    document = {
        "schema_version": REPORT_DOCUMENT_VERSION,
        "report_id": snapshot["report_id"],
        "report_version": snapshot["report_version"],
        "frozen_at": snapshot["frozen_at"],
        "project": {"project_id": project["project_id"], "name": project["name"], "period": project["period"], "source_version": snapshot["versions"]["project"]},
        "field_catalog": _catalog(snapshot),
        "sections": section_index(),
        "defects": [],
    }
    for source in snapshot.get("defects", []):
        document["defects"].append({
            "defect_id": source["defect_id"], "building_id": source["building_id"], "facade_id": source["facade_id"], "category_id": source["category_id"],
            "expert_conclusion": source["expert_conclusion"],
            "evidence": [_map_evidence(item) for item in source.get("evidence", [])],
        })
    return validate_report_document(document)

