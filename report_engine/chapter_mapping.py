"""Stable section order shared by future DOCX and PDF renderers."""

CHAPTERS = (
    ("cover", "封面"),
    ("responsibility", "责任页"),
    ("project_overview", "工程概况"),
    ("basis_method", "检测依据与方法"),
    ("instruments", "仪器设备"),
    ("facade_index", "楼栋与立面索引"),
    ("defect_summary", "缺陷汇总表"),
    ("defect_evidence", "逐缺陷证据页"),
    ("conclusion", "结论"),
    ("signature", "签章区"),
)


def section_index():
    return [{"id": key, "title": title, "source": "report_document"} for key, title in CHAPTERS]

