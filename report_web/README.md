# report_web

独立的网页端外墙检测报告生成工作台。它不引用现有前端、后端或数据库，只消费 `report-document/v1` JSON；可用作 #83、#88、#130、#131 的网页端预览基础。

## 打开方式

先生成与 Building_76 参考报告格式、内容一致的页面：

```powershell
python build_reference_preview.py
```

之后打开 `index.html`，或在该目录执行：

```powershell
python -m http.server 8090
```

`index.html` 默认打开 `generator.html`：用户在此提交 `ReportDocument v1`、批准脱敏证据与可选依据附件，完成预检后生成网页预览。页面会阻止未冻结专家结论、未批准脱敏证据、责任信息缺失和缺少证据文件的正式预览。`building_76_reference.html` 保留参考报告的 90 个逐缺陷页、目录、声明、汇总与四图证据布局；动态 `ReportDocument v1` 预览位于 `preview.html`。

## 设计约束

- 仅静态 HTML / CSS / JavaScript，无构建步骤；
- 延续参考报告的工程文档结构和方正表格，而非网站卡片风格；
- 模型估算、未采集、不可达、待确认均明确显示状态，绝不伪装成正式量测；
- 本目录是新模块，与 `frontend/` 完全隔离。

