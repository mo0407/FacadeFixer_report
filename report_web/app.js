(function () {
  "use strict";
  var reportRoot = document.getElementById("report");
  var labels = { concrete_crack:"裂缝", concrete_spalling:"剥落", rust_stain:"锈迹", water_stain:"水渍", tile_crack:"瓷砖裂缝", tile_spalling:"瓷砖剥落", contaminants:"污染物/附着物" };
  var severity = { minor:{text:"轻微缺陷",level:1,advice:"暂不修复，纳入后续巡检。"}, general:{text:"一般缺陷",level:2,advice:"建议安排局部修缮并复核。"}, serious:{text:"严重缺陷",level:3,advice:"建议立即采取防坠落措施并尽快修复。"} };
  function esc(value) { return String(value == null ? "待补充" : value).replace(/[&<>'"]/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]; }); }
  function value(item, fallback) { return item || fallback || "待补充"; }
  function sourceText(data) { return "本报告基于冻结的 ReportDocument v1 数据生成。模型估算、未采集、不可达和待确认信息均按原状态展示，不作为正式量测结果。"; }
  function photos(defect, number) {
    var evidence = defect.evidence || [];
    var images = (defect.reference_images || []).concat(evidence.map(function (item) { return item.image_uri; })).filter(function (uri, index, all) { return uri && all.indexOf(uri) === index; });
    var captions = ["缺陷在大图中的位置", "缺陷局部特写", "缺陷掩码（二值分割）", "缺陷掩码与原图叠加"];
    if (!images.length) return '<div class="photo-box"><div class="photo-placeholder">未提供可打印的证据图片</div><div class="caption">请返回工作台选择图片文件。</div></div>';
    return [0, 1, 2, 3].map(function (index) {
      var uri = images[index % images.length];
      return '<div class="photo-box"><img src="' + esc(uri) + '" alt="缺陷' + number + '证据图 ' + (index + 1) + '"><div class="caption">图 ' + number + '-' + String.fromCharCode(97 + index) + ' — ' + captions[index] + '</div></div>';
    }).join("");
  }
  function imageName(defect) {
    var uri = ((defect.reference_images || [])[1] || ((defect.evidence || [])[0] || {}).image_uri || "");
    return uri ? decodeURIComponent(uri.split("/").pop()) : "待补充";
  }
  function summaryRows(defects) {
    return defects.map(function (defect, index) {
      var rule = severity[defect.severity] || severity.general;
      return '<tr><td>' + (index + 1) + '</td><td>' + esc(labels[defect.category_id] || defect.category_id) + '</td><td>' + esc(defect.building_id) + '</td><td>' + esc(defect.facade_id) + '</td><td class="severity severity-' + rule.level + '">' + rule.text + '</td><td>' + esc(rule.advice) + '</td></tr>';
    }).join("");
  }
  function details(defects) {
    return defects.map(function (defect, index) {
      var rule = severity[defect.severity] || severity.general;
      var conclusion = defect.expert_conclusion || {};
      var typeName = labels[defect.category_id] || defect.category_id;
      return '<section class="detail" id="defect-' + (index + 1) + '"><div class="detail-title">缺陷 ' + (index + 1) + ' — ' + esc(typeName) + '</div>' +
        '<table class="info-table defect-table"><tr><td>原始图像</td><td>' + esc(imageName(defect)) + '</td><td>拍摄时间</td><td>' + esc(defect.captured_at) + '</td></tr>' +
        '<tr><td>GPS纬度</td><td>' + esc(defect.gps_latitude) + '</td><td>GPS经度</td><td>' + esc(defect.gps_longitude) + '</td></tr>' +
        '<tr><td>拍摄高度</td><td>' + esc(defect.capture_height) + '</td><td>行人风险</td><td>' + esc(defect.pedestrian_risk || "否") + '</td></tr>' +
        '<tr><td><strong>缺陷类型</strong></td><td colspan="3"><strong>' + esc(typeName) + '</strong><br><span class="detail-reason">判断依据（AI 草案，需人工复核）：' + esc(value(conclusion.text, "待大模型生成并由人工复核")) + '</span></td></tr>' +
        '<tr><td>严重程度</td><td colspan="3"><span class="severity severity-' + rule.level + '">' + rule.text + '</span><br><span class="detail-reason">严重程度依据（AI 草案，需人工复核）：' + esc(value(defect.severity_reason, "待大模型生成并由人工复核")) + '</span></td></tr>' +
        '<tr><td>处理建议</td><td colspan="3">' + esc(value(defect.treatment_advice, rule.advice)) + '</td></tr></table>' +
        '<div class="photo-row detail-photo-row">' + photos(defect, index + 1) + '</div></section>';
    }).join("");
  }
  function render(data) {
    if (!data || data.schema_version !== "report-document/v1") throw new Error("仅支持 report-document/v1 JSON");
    var project = data.project || {}, defects = data.defects || [], roles = project.responsibility || {};
    var standards = (project.standards || []).map(function (standard) { return "<li>" + esc(standard) + "</li>"; }).join("") || "<li>待补充</li>";
    var instruments = (project.instruments || []).map(function (item, index) { return "<tr><td>" + (index + 1) + "</td><td>" + esc(item.name) + "</td><td>" + esc(item.model) + "</td><td>" + esc(item.asset_id) + "</td></tr>"; }).join("") || "<tr><td>1</td><td>待补充</td><td>待补充</td><td>待补充</td></tr>";
    var counts = defects.reduce(function (out, item) { out[item.category_id] = (out[item.category_id] || 0) + 1; return out; }, {});
    var categoryRows = Object.keys(counts).map(function (key, index) { return "<tr><td>" + (index + 1) + "</td><td>" + esc(labels[key] || key) + "</td><td>" + counts[key] + "</td></tr>"; }).join("") || "<tr><td>—</td><td>未记录缺陷</td><td>0</td></tr>";
    reportRoot.innerHTML =
      '<section class="cover"><h1>' + esc(project.name || "外墙检测鉴定") + '<br>外墙检测鉴定报告</h1><p>基于无人机航拍与 AI 智能识别技术</p><p>检测期次：' + esc(project.period) + '<br>报告版本：' + esc(data.report_version) + '</p></section>' +
      '<section class="sign-page"><h2>报告签署页</h2><table class="info-table"><tr><th>项目</th><th>内容</th><th>项目</th><th>内容</th></tr><tr><td>委托单位</td><td>' + esc(project.client) + '</td><td>工程名称</td><td>' + esc(project.name) + '</td></tr><tr><td>工程地点</td><td>' + esc(project.location) + '</td><td>项目类型</td><td>外墙外立面检测鉴定</td></tr><tr><td>现场检测</td><td>' + esc(roles.inspector) + '</td><td>报告编写</td><td>' + esc(roles.author) + '</td></tr><tr><td>报告审核</td><td>' + esc(roles.reviewer) + '</td><td>报告批准</td><td>' + esc(roles.approver) + '</td></tr><tr><td>冻结时间</td><td>' + esc(data.frozen_at) + '</td><td>报告编号</td><td>' + esc(data.report_id) + '</td></tr></table></section>' +
      '<section class="statement"><h2>企业声明</h2><p>1、本报告仅对委托检测范围内容负责；</p><p>2、本报告无编写人、审核人、批准人确认不得作为正式签署文件；</p><p>3、委托方提供资料的真实可靠性由委托方负责；</p><p>4、对报告若有异议，委托方可在收到报告后书面提出。</p></section>' +
      '<section class="new-section"><h2>目    录</h2><p><strong>一、工程概况</strong></p><p><strong>二、鉴定目的、对象、内容及方法</strong></p><p><strong>三、鉴定依据及材料</strong></p><p><strong>四、主要检测仪器</strong></p><p><strong>五、现场勘验及检测情况</strong></p><p><strong>六、鉴定结论</strong></p><p><strong>七、建议与说明</strong></p></section>' +
      '<section class="new-section"><h2>一、工程概况</h2><p>' + esc(value(project.overview, sourceText(data))) + '</p><h2>二、鉴定目的、对象、内容及方法</h2><h3>2.1 鉴定目的</h3><p>了解建筑外墙当前质量情况，为复核、维修与后续巡检提供依据。</p><h3>2.2 鉴定对象</h3><p>' + esc(project.name) + ' 外墙外立面。</p><h3>2.3 鉴定内容</h3><p>对已批准范围内的外墙缺陷进行记录、复核及分级。</p><h3>2.4 鉴定方法</h3><p>' + esc(value(project.method, "采用无人机航拍目视检查，结合经批准的缺陷证据进行复核。")) + '</p><h3>2.5 鉴定标准</h3><ol>' + standards + '</ol></section>' +
      '<section class="new-section"><h2>三、鉴定依据及材料</h2><p>' + sourceText(data) + '</p><h2>四、主要检测仪器</h2><table><tr><th>序号</th><th>仪器名称</th><th>型号</th><th>编号</th></tr>' + instruments + '</table></section>' +
      '<section class="new-section"><h2>五、现场勘验及检测情况</h2><p>本次共记录缺陷 ' + defects.length + ' 处，详细情况如下。</p><h3>5.1 缺陷类别统计</h3><table><tr><th>类别编号</th><th>缺陷类型</th><th>缺陷数量（处）</th></tr>' + categoryRows + '</table><h3>5.2 建筑物外墙外立面缺陷情况</h3><table><tr><th>序号</th><th>缺陷类型</th><th>楼栋</th><th>立面</th><th>严重程度</th><th>处理建议</th></tr>' + summaryRows(defects) + '</table></section>' + details(defects) +
      '<section class="new-section"><h2>六、鉴定结论</h2><p>依据冻结检测数据，当前共记录 ' + defects.length + ' 处缺陷。报告中模型估算、未采集、不可达和待确认信息均不作为正式量测结果。</p><h2>七、建议与说明</h2><p>建议按缺陷严重程度安排现场复核与维修，并在正式签署前核验责任信息、证据材料及版本状态。</p></section>';
  }
  function readGenerated() {
    var generated = sessionStorage.getItem("facadefixer-generated-report");
    if (!generated) { try { generated = localStorage.getItem("facadefixer-generated-report"); } catch (ignore) {} }
    if (!generated && window.name.indexOf("facadefixer-generated-report:") === 0) generated = window.name.slice("facadefixer-generated-report:".length);
    return generated;
  }
  function showError(error) { reportRoot.innerHTML = '<section class="new-section"><h2>无法加载报告</h2><p>' + esc(error.message) + '</p></section>'; }
  try { var generated = readGenerated(); if (!generated) throw new Error("请先在报告生成工作台生成网页报告预览。"); render(JSON.parse(generated)); } catch (error) { showError(error); }
  document.getElementById("print-button").addEventListener("click", function () { window.focus(); window.print(); });
}());

