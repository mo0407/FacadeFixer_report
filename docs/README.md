# report_web

独立的网页端外墙检测报告生成工作台。它不引用现有前端、后端或数据库，只消费 `report-document/v1` JSON；可用作 #83、#88、#130、#131 的网页端预览基础。

## 打开方式

仓库已附带 `building_76_reference.html`，可离线打开并由工作台中的“查看示例版式”直接访问。若需要从本机参考文件重新构建该示例页：

```powershell
python build_reference_preview.py
```

之后打开 `index.html`，或在该目录执行：

```powershell
python -m http.server 8090
```

`index.html` 默认打开 `generator.html`：用户在此提交 `ReportDocument v1`、批准脱敏证据与可选依据附件，完成预检后生成网页预览。页面会阻止未冻结专家结论、未批准脱敏证据、责任信息缺失和缺少证据文件的正式预览；“载入 Building_76 示例”会同时装载内置的批准脱敏示例证据，因此可直接生成预览。`building_76_reference.html` 保留参考报告的 90 个逐缺陷页、目录、声明、汇总与四图证据布局；动态 `ReportDocument v1` 预览位于 `preview.html`。

## 书生模型生成分析文字

在打开网页前，另开一个 PowerShell 窗口并在本目录运行：

```powershell
python ai_service.py
```

本地服务只监听 `127.0.0.1:8092`，从 `E:\ai\token.txt` 中标记为“书生 / InternLM / 浦语”的那一行读取密钥；密钥不会进入浏览器、报告 JSON 或 Git 仓库。点击“生成网页报告预览”时，服务调用 `intern-s2-preview-397b` 生成每条缺陷的“判定依据、严重程度依据、行人风险”。行人风险仅显示“是/否”：模型判断影响较小或低风险时为“否”，仅在判断存在实质性伤人影响时为“是”。浏览器仅传送缺陷类别、识别描述和像素量化字段，不传送图片、GPS、拍摄时间或高度。处理建议不会由模型生成，而是使用固定的四档分级。

## 设计约束

## GitHub Pages 在线版

GitHub Pages 只能托管静态文件：在线版可直接使用报告工作台、查看 Building_76 示例、导入资料及打印预览。书生模型服务须部署在受控后端，密钥只能保存于该后端的环境变量或密钥管理中；不得上传 `E:\\ai\\token.txt` 或将密钥写入前端代码。

- 仅静态 HTML / CSS / JavaScript，无构建步骤；
- 延续参考报告的工程文档结构和方正表格，而非网站卡片风格；
- 模型估算、未采集、不可达、待确认均明确显示状态，绝不伪装成正式量测；
- 本目录是新模块，与 `frontend/` 完全隔离。

