import unittest

from report_engine import ReportContractError, build_report_document
from report_engine.schema import measured_defect_count


def snapshot():
    return {
        "report_id": "report-001", "report_version": "1", "frozen_at": "2026-08-27T00:00:00Z",
        "project": {"project_id": "p-1", "name": "示例小区", "period": "2026-Q3"},
        "versions": {"project": "project/v4", "inspection_period": "period/v2", "frozen_expert_conclusion": "conclusion/v7", "approved_redacted_evidence": "evidence/v3"},
        "defects": [{"defect_id": "d-1", "building_id": "b-1", "facade_id": "south", "category_id": "concrete_crack", "expert_conclusion": {"status": "frozen", "frozen_at": "2026-08-27T00:00:00Z", "source_version": "conclusion/v7"}, "evidence": [{"evidence_id": "e-1", "state": "measured", "source": "inspection", "period": "2026-Q3", "version": "evidence/v3", "kind": "image", "approved_redaction": True}]}],
    }


class ReportDocumentTests(unittest.TestCase):
    def test_builds_canonical_sections_and_metadata(self):
        document = build_report_document(snapshot())
        self.assertEqual("report-document/v1", document["schema_version"])
        self.assertEqual(10, len(document["sections"]))
        self.assertEqual(4, len(document["field_catalog"]))
        self.assertEqual(1, measured_defect_count(document))

    def test_rejects_unfrozen_conclusion(self):
        value = snapshot()
        value["defects"][0]["expert_conclusion"]["status"] = "draft"
        with self.assertRaises(ReportContractError):
            build_report_document(value)

    def test_requires_reason_for_inaccessible_evidence(self):
        value = snapshot()
        value["defects"][0]["evidence"][0]["state"] = "inaccessible"
        with self.assertRaises(ReportContractError):
            build_report_document(value)


