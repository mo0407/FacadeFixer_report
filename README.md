# FacadeFixer Report

FacadeFixer 的独立报告生成模块，包含从冻结检测数据到网页报告预览的完整前端契约层。该仓库与主项目的 API、数据库、模型推理和原有前端隔离。

## 包结构

- `report_engine/`：`ReportDocument v1` 领域模型、字段来源与缺失规则、冻结专家结论及脱敏证据校验；
- `report_web/`：报告生成工作台、数据驱动网页预览、Building_76 参考报告构建器；
- `report_web/tests/`：静态页面与数据契约测试。

## 使用方式

```powershell
cd report_web
python -m http.server 8090
```

打开 `http://127.0.0.1:8090/generator.html`，提交：

1. `report-document/v1` JSON；
2. 已批准脱敏的证据文件；
3. 可选的标准、图纸、仪器校准或委托附件。

页面会检查：冻结专家结论、批准脱敏图片、责任信息（检测、编写、审核、批准）与证据文件。通过预检后可生成网页预览；正式签署、DOCX/PDF 转换及历史归档由后续模块负责。

## Building_76 参考版

若本机存在 `Building_76_外墙检测鉴定报告_v2.html`，可运行：

```powershell
python report_web/build_reference_preview.py --source "<参考报告路径>" --output "<输出路径>/building_76_reference.html"
```

构建器保留参考报告的章节、90 个逐缺陷页和四图证据布局，仅新增图片基址；它不会修改参考文件。

## 数据与隐私

仓库不包含原始无人机图片、缺陷证据、项目报告副本、个人信息或访问令牌。请只提交已批准脱敏的示例数据。

## 验证

```powershell
node report_web/tests/test_static_contract.js
python -m unittest discover -s report_engine/tests -v
```

