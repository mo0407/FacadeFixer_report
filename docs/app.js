(function () {
  "use strict";
  var reportRoot = document.getElementById("report");
  var labels = { concrete_crack:"裂缝", concrete_spalling:"剥落", rust_stain:"锈迹", water_stain:"水渍", tile_crack:"瓷砖裂缝", tile_spalling:"瓷砖剥落", contaminants:"污染物/附着物" };
  var severity = { minor:{text:"轻微缺陷",level:1,advice:"暂不修复"}, general:{text:"一般缺陷",level:2,advice:"小修"}, serious:{text:"严重缺陷",level:3,advice:"立即修复"} };
  function esc(value) { return String(value == null ? "待补充" : value).replace(/[&<>'"]/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]; }); }
  function value(item, fallback) { return item || fallback || "待补充"; }
  function repairLevel(item, fallback) { var text = String(item || ""); if (/立即修复/.test(text)) return "立即修复"; if (/大修/.test(text)) return "大修"; if (/小修/.test(text)) return "小修"; return fallback || "暂不修复"; }
  function yesNoRisk(item) { return String(item || "").trim() === "是" ? "是" : "否"; }
  function sourceText(data) { return "本报告基于冻结的 ReportDocument v1 数据生成。模型估算、未采集、不可达和待确认信息均按原状态展示，不作为正式量测结果。"; }
  function photos(defect, number) {
    var evidence = defect.evidence || [];
    var images = (defect.reference_images || []).concat(evidence.map(function (item) { return item.image_uri; })).filter(function (uri, index, all) { return uri && all.indexOf(uri) === index; });
    var captions = ["缺陷在大图中的位置", "缺陷局部特写", "缺陷掩码（二值分割）", "缺陷掩码与原图叠加"];
    if (!images.length) return '<div class="photo-box"><div class="photo-placeholder">未提供可打印的证据图片</div><div class="caption">请返回工作台选择图片文件。</div></div>';
    return [0, 1, 2, 3].map(function (index) {
      var uri = images[index % images.length];
      var fallback = images[1] || images[0];
      var fallbackAttr = index === 0 && fallback ? ' onerror="this.onerror=null;this.src=\'' + esc(fallback) + '\';"' : '';
      return '<div class="photo-box"><img src="' + esc(uri) + '"' + fallbackAttr + ' alt="缺陷' + number + '证据图 ' + (index + 1) + '"><div class="caption">图 ' + number + '-' + String.fromCharCode(97 + index) + ' — ' + captions[index] + '</div></div>';
    }).join("");
  }
  function imageName(defect) {
    var uri = ((defect.reference_images || [])[1] || ((defect.evidence || [])[0] || {}).image_uri || "");
    return uri ? decodeURIComponent(uri.split("/").pop()) : "待补充";
  }
  function summaryRows(defects) {
    return defects.map(function (defect, index) {
      var rule = severity[defect.severity] || severity.general;
      return '<tr><td>' + (index + 1) + '</td><td>' + esc(labels[defect.category_id] || defect.category_id) + '</td><td>' + esc(defect.building_id) + '</td><td>' + esc(defect.facade_id) + '</td><td class="severity severity-' + rule.level + '">' + rule.text + '</td><td>' + esc(repairLevel(defect.treatment_advice, rule.advice)) + '</td></tr>';
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
        '<tr><td>拍摄高度</td><td>' + esc(defect.capture_height) + '</td><td>行人风险</td><td>' + esc(yesNoRisk(defect.pedestrian_risk)) + '</td></tr>' +
        '<tr><td><strong>缺陷类型</strong></td><td colspan="3"><strong>' + esc(typeName) + '</strong><br><span class="detail-reason">判断依据：' + esc(value(conclusion.text, "依据已批准证据和量化结果判定。")) + '</span></td></tr>' +
        '<tr><td>严重程度</td><td colspan="3"><span class="severity severity-' + rule.level + '">' + rule.text + '</span><br><span class="detail-reason">严重程度依据：' + esc(value(defect.severity_reason, "依据缺陷量化面积和覆盖比例判定。")) + '</span></td></tr>' +
        '<tr><td>处理建议</td><td colspan="3">' + esc(repairLevel(defect.treatment_advice, rule.advice)) + '</td></tr></table>' +
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
      '<section class="new-section"><h2>一、工程概况</h2><p>' + esc(value(project.overview, project.name + " 位于" + value(project.location, "项目所在地") + "，本次受委托对其建筑外墙外立面进行检测鉴定。")) + '</p><p>经现场查勘及委托方提供资料，本次检测对象为建筑外墙可见部位；建筑结构、建设年代、外墙构造等资料以委托方最终确认资料为准。</p><p>因外墙面存在开裂、剥落、空鼓、锈蚀及其他可见缺陷，为了解 ' + esc(project.name) + ' 外墙目前质量情况，开展本次检测并出具外墙外立面检测鉴定报告。</p></section>' +
      '<section class="new-section"><h2>二、鉴定目的、对象、内容及方法</h2><h3>2.1 鉴定目的</h3><p>核查被鉴定建筑物外墙外立面缺陷及外墙构造可见情况。依据有关技术标准与规范、规程，在此基础上进行外墙外立面检测鉴定工作，并结合建筑物实际情况，提出合理的处理建议。</p><h3>2.2 鉴定对象</h3><p>' + esc(project.name) + ' 外墙外立面，检测范围以委托方确认范围为准。</p><h3>2.3 鉴定内容</h3><p>根据委托方提供的资料进行现场查勘。本次检测鉴定内容为：对外墙面开裂、空鼓、脱落、锈蚀及装饰构件松动等可见缺陷进行记录、复核与分级；根据检测数据，遵照国家有关技术标准与规范、规程对外墙外观质量进行鉴定。</p><h3>2.4 鉴定方法</h3><p>' + esc(value(project.method, "结合无人机航拍目视法，查明缺陷存在的位置及大致范围面积。")) + '</p><h3>2.5 鉴定标准</h3><p>当外墙外保温系统空鼓面积比处于允许范围内时，宜进行局部修缮；当空鼓面积比超过允许范围或出现明显空鼓、脱落情况时，应进行相应范围的整体修缮。具体执行标准如下：</p><ol>' + standards + '</ol></section>' +
      '<section class="new-section"><h2>三、鉴定依据及材料</h2><p>本报告依据国家现行有关技术标准、规范、规程及委托方提供的设计图纸、检测资料编制，主要依据如下：</p><ol>' + standards + '</ol><p>委托方提供资料的真实可靠性由委托方负责；本报告仅对委托检测范围内容负责。</p></section>' +
      '<section class="new-section"><h2>四、主要检测仪器</h2><table><tr><th>序号</th><th>仪器名称</th><th>仪器型号规格</th><th>管理编号</th></tr>' + instruments + '</table></section>' +
      '<section class="new-section"><h2>五、现场勘验及检测情况</h2><p>本次共记录缺陷 ' + defects.length + ' 处，详细情况如下。</p><h3>5.1 缺陷类别统计</h3><table><tr><th>类别编号</th><th>缺陷类型</th><th>缺陷数量（处）</th></tr>' + categoryRows + '</table><h3>5.2 建筑物外墙外立面缺陷情况</h3><table><tr><th>序号</th><th>缺陷类型</th><th>楼栋</th><th>立面</th><th>严重程度</th><th>处理建议</th></tr>' + summaryRows(defects) + '</table></section>' + details(defects) +
      '<section class="new-section"><h2>六、鉴定结论</h2><p>根据现场调查、查勘、委托方提供资料及检测情况，结合相关技术标准与规范、规程，作鉴定结论如下：</p><p>' + esc(project.name) + ' 建筑外墙外立面存在开裂、剥落、空鼓、锈蚀及其他可见质量问题。本次检测共发现缺陷 <strong>' + defects.length + '</strong> 处，缺陷统计如下：</p><table><tr><th>类别编号</th><th>缺陷类型</th><th>数量（处）</th></tr>' + categoryRows + '</table><p>经综合评估，应结合逐项缺陷分级及现场复核情况，及时采取相应修缮措施。</p></section>' +
      '<section class="new-section"><h2>七、建议与说明</h2><h3>7.1 安全防护措施</h3><p>对经复核存在明显脱落、松动等安全隐患的区域，宜在缺陷区域下方设置警戒线、警示标志；必要时采取临时防护措施，确保行人及车辆安全。</p><h3>7.2 修缮处理建议</h3><p>建议业主聘请具有相应资质的施工单位，按照逐项缺陷处理建议开展修缮。施工前应清除松动、劣化部分至坚实基层；修补后应恢复原有饰面，并保证外观和功能与原墙面相协调。</p><h3>7.3 其他说明</h3><p>1）外墙缺陷可能处于动态发展过程中，本报告基于检测时点现状有效，修缮施工时宜进一步查明缺陷范围并及时采取相应措施。</p><p>2）本报告仅对委托检测范围内容负责，未检测区域不代表无缺陷。</p><p>3）报告签署前，应核验责任信息、证据材料及版本状态。</p></section>' +
      '<section class="new-section"><h2>附件一：公司资质材料</h2><p>企业营业执照、资质证书、计量认证证书等资料由项目归档流程另行提供。</p></section>';
  }
  function readGenerated() {
    var generated = sessionStorage.getItem("facadefixer-generated-report");
    if (!generated) { try { generated = localStorage.getItem("facadefixer-generated-report"); } catch (ignore) {} }
    if (!generated && window.name.indexOf("facadefixer-generated-report:") === 0) generated = window.name.slice("facadefixer-generated-report:".length);
    return generated;
  }
  function showError(error) { reportRoot.innerHTML = '<section class="new-section"><h2>无法加载报告</h2><p>' + esc(error.message) + '</p></section>'; }
  try { var generated = readGenerated(); if (!generated) throw new Error("请先在报告生成工作台生成网页报告预览。"); render(JSON.parse(generated)); } catch (error) { showError(error); }
  var wordToggle = document.getElementById("word-toggle");
  function setWordMode(enabled) {
    document.body.classList.toggle("word-mode", enabled);
    wordToggle.setAttribute("aria-pressed", enabled ? "true" : "false");
    wordToggle.textContent = enabled ? "网页连续版" : "Word 分页版";
    try { sessionStorage.setItem("facadefixer-word-mode", enabled ? "1" : "0"); } catch (ignore) {}
  }
  try { setWordMode(sessionStorage.getItem("facadefixer-word-mode") === "1"); } catch (ignore) { setWordMode(false); }
  wordToggle.addEventListener("click", function () { setWordMode(!document.body.classList.contains("word-mode")); });
  document.getElementById("print-button").addEventListener("click", function () { window.focus(); window.print(); });
}());

