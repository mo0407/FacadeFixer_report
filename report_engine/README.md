# report_engine

Issue #79 的独立报告领域层。它定义 `ReportDocument v1`、字段来源/缺失措辞、标准章节顺序，以及“冻结专家结论 + 已批准脱敏证据”的导出约束。

它不访问数据库、不调用模型，也不渲染 DOCX/PDF；后续 #83、#88、#130、#131、#84 只能消费这一份模型。

运行测试：`python -m unittest discover -s report_engine/tests -v`

