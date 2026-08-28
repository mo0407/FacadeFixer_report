(function () {
  "use strict";

  var reportInput = document.getElementById("report-json");
  var evidenceInput = document.getElementById("evidence-files");
  var attachmentInput = document.getElementById("attachment-files");
  var fileList = document.getElementById("file-list");
  var checks = document.getElementById("check-list");
  var readiness = document.getElementById("readiness");
  var generate = document.getElementById("generate");
  var result = document.getElementById("result");
  var generationProgress = document.getElementById("generation-progress");
  var sample = document.getElementById("load-sample");
  var metaInput = document.getElementById("meta-files");
  var maskInput = document.getElementById("mask-files");
  var mapInput = document.getElementById("map-files");
  var report = null;
  var sampleEvidenceLoaded = false;
  var evidenceImages = [];
  var phase = 1;
  var AI_ENDPOINT = "http://127.0.0.1:8092/api/report-analysis";
  var AI_BATCH_SIZE = 12;

  function setPhase(nextPhase) {
    phase = nextPhase;
  }

  function item(ok, text) {
    return '<div class="check ' + (ok ? "ok" : "bad") + '">' + text + "</div>";
  }

  function escText(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]; });
  }

  function renderFiles() {
    var groups = [[reportInput, "报告 JSON"], [evidenceInput, "证据材料"], [attachmentInput, "依据附件"]];
    var html = [];
    groups.forEach(function (group) {
      Array.prototype.forEach.call(group[0].files || [], function (file) {
        html.push("<li>" + group[1] + "：" + file.name + "（" + Math.ceil(file.size / 1024) + " KB）</li>");
      });
    });
    fileList.innerHTML = html.length ? "<ul>" + html.join("") + "</ul>" : "尚未选择文件。";
  }

  function renderChecks() {
    if (!report) {
      checks.innerHTML = '<p class="empty">等待提交 ReportDocument。</p>';
      readiness.textContent = "待提交";
      generate.disabled = true;
      setPhase(1);
      return;
    }

    var project = report.project || {};
    var roles = project.responsibility || {};
    var defects = report.defects || [];
    var frozen = defects.length > 0 && defects.every(function (defect) {
      return defect.expert_conclusion && defect.expert_conclusion.status === "frozen";
    });
    var approved = defects.length > 0 && defects.every(function (defect) {
      return (defect.evidence || []).every(function (evidence) {
        return evidence.kind !== "image" || evidence.approved_redaction === true;
      });
    });
    var rolesOk = ["inspector", "author", "reviewer", "approver"].every(function (role) {
      return roles[role] && roles[role] !== "待补充";
    });
    var evidenceOk = evidenceImages.length > 0 || sampleEvidenceLoaded;
    var evidenceText = sampleEvidenceLoaded ? "已载入内置的已批准脱敏示例证据图片" : evidenceImages.length ? "已读取并嵌入证据图片" : "请至少选择一张批准脱敏证据图片";
    var valid = report.schema_version === "report-document/v1" && frozen && approved && evidenceOk && rolesOk;

    checks.innerHTML = [
      item(report.schema_version === "report-document/v1", "ReportDocument v1 数据契约"),
      item(frozen, "全部缺陷使用冻结专家结论"),
      item(approved, "图片证据已批准脱敏"),
      item(evidenceOk, evidenceText),
      item(rolesOk, "责任信息完整（检测、编写、审核、批准）")
    ].join("");

    readiness.textContent = valid ? "可生成正式预览" : "待补充";
    readiness.style.color = valid ? "#16704b" : "#8f6206";
    generate.disabled = !valid;
    if (phase !== 3) setPhase(2);
  }

  function load(value) {
    try {
      report = typeof value === "string" ? JSON.parse(value) : value;
      if (report.schema_version !== "report-document/v1") throw new Error("报告 JSON 的 schema_version 必须为 report-document/v1");
      result.hidden = true;
      renderChecks();
    } catch (error) {
      report = null;
      checks.innerHTML = '<div class="check bad">' + error.message + "</div>";
      generate.disabled = true;
      setPhase(1);
    }
  }

  function loadSample() {
    try {
      var data = JSON.parse(document.getElementById("sample-data").textContent.replace(/^\+/gm, ""));
      var sampleRoot = "assets/Building_76/";
      var sampleIds = ["DJI_20240930101210_0004_V_0_43_173_0_c5", "DJI_20240930101210_0004_V_0_43_173_1_c5", "DJI_20240930101210_0004_V_0_43_173_2_c0"];
      data.project.responsibility = { inspector: "张三、李四", author: "王五", reviewer: "赵六", approver: "孙七" };
      data.defects.forEach(function (defect, index) {
        var imageId = sampleIds[index];
        var examples = [
          { area: 454965, ratio: 3.8, normal: 8, altitude: "43.173 m", latitude: "(22.0, 20.0, 19.3321) N", longitude: "(114.0, 8.0, 48.3422) E", basis: "墙体表面大面积破损，可见裸露基层及风化痕迹，判断为大面积剥落。", severity: "缺陷面积454965像素，占比3.8%（通常大面积破损类缺陷不超过8.0%），该缺陷达正常阈值的0.5倍，局部集中，严重程度判断为轻微缺陷。", advice: "暂不修复" },
          { area: 459792, ratio: 3.8, normal: 8, altitude: "43.173 m", latitude: "(22.0, 20.0, 19.3321) N", longitude: "(114.0, 8.0, 48.3422) E", basis: "墙体表面大面积破损，可见裸露基层及风化痕迹，判断为大面积剥落。", severity: "缺陷面积459792像素，占比3.8%（通常大面积破损类缺陷不超过8.0%），该缺陷达正常阈值的0.5倍，局部集中，严重程度判断为轻微缺陷。", advice: "暂不修复" },
          { area: 140920, ratio: 1.2, normal: 3, altitude: "43.173 m", latitude: "(22.0, 20.0, 19.3321) N", longitude: "(114.0, 8.0, 48.3422) E", basis: "图像中存在线状裂缝，与周围墙体形成明显灰度差异，判断为裂缝。", severity: "缺陷面积140920像素，占比1.2%（通常裂缝类缺陷不超过3.0%），该缺陷达正常阈值的0.4倍，局部集中，严重程度判断为一般缺陷。", advice: "小修" }
        ][index];
        defect.severity = ["minor", "minor", "general"][index];
        defect.reference_images = [sampleRoot + "single_defect_maps/" + imageId + "_map.jpg", sampleRoot + "defects/" + imageId + ".jpg", sampleRoot + "defect_masks/" + imageId + "_mask.png", sampleRoot + "defect_masks/" + imageId + "_vis.jpg"];
        defect.analysis_input = { class_id: [5, 5, 0][index], class_name: ["大面积剥落", "大面积剥落", "裂缝"][index], description: examples.basis, pixel_area: examples.area, area_ratio_percent: examples.ratio, normal_threshold_percent: examples.normal, severity_label: ["轻微", "轻微", "中度"][index] };
        defect.capture_height = examples.altitude; defect.gps_latitude = examples.latitude; defect.gps_longitude = examples.longitude; defect.pedestrian_risk = "否"; defect.severity_reason = examples.severity; defect.treatment_advice = sampleStyleAdvice(defect.analysis_input); defect.expert_conclusion.text = examples.basis;
        defect.evidence.forEach(function (evidence) {
          evidence.approved_redaction = true;
          if (evidence.kind === "image") evidence.image_uri = defect.reference_images[1];
        });
      });
      report = data;
      sampleEvidenceLoaded = true;
      evidenceImages = [];
      result.hidden = true;
      renderChecks();
      fileList.innerHTML = "<ul><li>已载入 Building_76 示例数据和内置的已批准脱敏示例证据。</li></ul>";
    } catch (error) {
      checks.innerHTML = '<div class="check bad">内置示例数据损坏，请联系维护人员。</div>';
      generate.disabled = true;
      setPhase(1);
    }
  }

  function persistGeneratedReport() {
    var serialized = JSON.stringify(report);
    sessionStorage.setItem("facadefixer-generated-report", serialized);
    try { localStorage.setItem("facadefixer-generated-report", serialized); } catch (ignore) {}
    window.name = "facadefixer-generated-report:" + serialized;
  }

  function readImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve({ name: file.name, uri: reader.result }); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function attachEvidenceImages() {
    if (!report || !evidenceImages.length) return;
    var imageIndex = 0;
    (report.defects || []).forEach(function (defect, defectIndex) {
      defect.reference_images = evidenceImages.slice(defectIndex * 4, defectIndex * 4 + 4).map(function (image) { return image.uri; });
      if (!defect.reference_images.length) defect.reference_images = [evidenceImages[defectIndex % evidenceImages.length].uri];
      (defect.evidence || []).forEach(function (evidence) {
        if (evidence.kind === "image" && evidenceImages[imageIndex]) {
          evidence.image_uri = evidenceImages[imageIndex].uri;
          evidence.caption = evidence.caption || evidenceImages[imageIndex].name;
          imageIndex += 1;
        }
      });
    });
  }

  function readText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsText(file, "utf-8");
    });
  }

  function imageMap(files) {
    return Promise.all(Array.prototype.map.call(files || [], readImage)).then(function (items) {
      return items.reduce(function (result, item) { result[item.name] = item.uri; return result; }, {});
    });
  }

  function analysisText(item) {
    var area = Math.max(1, Number(item.width || 0) * Number(item.height || 0));
    var ratio = area / 12000000 * 100;
    var normal = { 0: 3, 1: 3, 2: 2, 3: 2, 4: 1.5, 5: 10, 7: 3, 8: 2, 10: 5, 11: 3 }[item.class_id] || 5;
    var multiple = ratio / normal;
    var type = item.class_name || "该类缺陷";
    var severity = item.severity || "轻微";
    var basis = { 0: "图像中存在线状或网状暗色纹理，与周围墙体形成明显灰度差异", 1: "墙体表面可见空鼓剥离区域，局部伴有饰面层脱落痕迹", 2: "墙体表面出现块状或片状脱落区域，基层暴露", 3: "图像中可见红褐色锈蚀斑点或条纹，金属构件表面氧化特征明显", 5: "墙体表面大面积破损，可见裸露基层及风化痕迹", 7: "外墙瓷砖表面出现线状或网状裂缝，贯穿瓷砖面层", 8: "外墙瓷砖面层出现块状脱落，底层水泥砂浆层暴露" }[item.class_id] || "图像中可见与周围墙体明显差异的异常区域";
    return {
      basis: basis + "，判断为" + type + "。",
      severity: "缺陷面积" + area + "像素，占比" + ratio.toFixed(1) + "%（通常" + type + "类缺陷不超过" + normal.toFixed(1) + "%），该缺陷达正常阈值的" + multiple.toFixed(1) + "倍，呈局部区域分布，严重程度判断为" + (severityLevel(severity) === "serious" ? "严重缺陷" : severityLevel(severity) === "general" ? "一般缺陷" : "轻微缺陷") + "。",
      advice: sampleStyleAdvice(item),
      risk: item.pedestrian_risk || "否"
    };
  }

  function sampleStyleAdvice(item) {
    var source = item.advice || item.severity_label || item.severity || "";
    if (/立即修复/.test(source) || /严重|重度/.test(source)) return "立即修复";
    if (/大修/.test(source) || /中度/.test(source)) return "大修";
    if (/小修/.test(source) || /一般/.test(source)) return "小修";
    return "暂不修复";
  }

  function yesNoRisk(value) {
    return value === true || /^是$/.test(String(value || "").trim()) ? "是" : "否";
  }

  function aiPayload(defect) {
    var input = defect.analysis_input || {};
    var area = Number(input.pixel_area || defect.pixel_area || 0);
    var width = Number(input.width || defect.pixel_width || 0);
    var height = Number(input.height || defect.pixel_height || 0);
    if (!area && width && height) area = width * height;
    var ratio = Number(input.area_ratio_percent);
    if (!isFinite(ratio)) ratio = area ? area / 12000000 * 100 : null;
    var normal = Number(input.normal_threshold_percent);
    if (!isFinite(normal)) normal = { 0: 3, 1: 3, 2: 2, 3: 2, 4: 1.5, 5: 10, 7: 3, 8: 2, 10: 5, 11: 3 }[input.class_id] || 5;
    return {
      defect_id: defect.defect_id,
      class_id: input.class_id == null ? null : input.class_id,
      defect_type: input.class_name || labelsForAi(defect.category_id),
      recognition_description: input.description || "未提供",
      pixel_area: area || null,
      area_ratio_percent: ratio == null ? null : Number(ratio.toFixed(2)),
      normal_threshold_percent: normal,
      threshold_multiple: ratio == null ? null : Number((ratio / normal).toFixed(2)),
      severity_label: input.severity_label || defect.severity
    };
  }

  function labelsForAi(category) {
    return { concrete_crack:"裂缝", concrete_spalling:"剥落", rust_stain:"锈迹", water_stain:"水渍", tile_crack:"瓷砖裂缝", tile_spalling:"瓷砖剥落" }[category] || category || "待确认";
  }

  function requireAnalysisFields(analysis) {
    return analysis && typeof analysis.defect_id === "string" && typeof analysis.basis === "string" && typeof analysis.severity_reason === "string" && typeof analysis.pedestrian_risk === "string";
  }

  function requestAiAnalysis(defects) {
    return fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defects: defects.map(aiPayload) })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) throw new Error(body.error || "书生服务请求失败");
        if (!Array.isArray(body.analyses)) throw new Error("书生服务未返回缺陷分析结果");
        return body.analyses;
      });
    });
  }

  function enrichWithAiAnalysis() {
    var defects = report.defects || [];
    var batches = [];
    for (var index = 0; index < defects.length; index += AI_BATCH_SIZE) batches.push(defects.slice(index, index + AI_BATCH_SIZE));
    var received = [];
    var chain = Promise.resolve();
    batches.forEach(function (batch, batchIndex) {
      chain = chain.then(function () {
        var startPercent = Math.round(batchIndex / batches.length * 100);
        var completedPercent = Math.round((batchIndex + 1) / batches.length * 100);
        var displayPercent = startPercent;
        var waitingLimit = Math.max(startPercent + 1, completedPercent - 5);
        setGenerationProgress(displayPercent, "正在调用书生模型生成缺陷分析（" + (batchIndex + 1) + "/" + batches.length + "）");
        readiness.textContent = "正在生成分析文字（" + (batchIndex + 1) + "/" + batches.length + "）";
        var progressTimer = setInterval(function () {
          if (displayPercent < waitingLimit) {
            displayPercent = Math.min(waitingLimit, displayPercent + Math.max(1, Math.ceil((completedPercent - startPercent) / 24)));
            setGenerationProgress(displayPercent, "正在调用书生模型生成缺陷分析（" + (batchIndex + 1) + "/" + batches.length + "）");
          }
        }, 400);
        return requestAiAnalysis(batch).then(function (analyses) {
          clearInterval(progressTimer);
          received = received.concat(analyses);
          setGenerationProgress(completedPercent, "已完成 " + (batchIndex + 1) + "/" + batches.length + " 批缺陷分析");
        }, function (error) {
          clearInterval(progressTimer);
          throw error;
        });
      });
    });
    return chain.then(function () {
      var byId = {};
      received.forEach(function (analysis) { if (requireAnalysisFields(analysis)) byId[analysis.defect_id] = analysis; });
      if (Object.keys(byId).length !== defects.length) throw new Error("书生服务返回的缺陷分析不完整，未生成报告。请重试。");
      defects.forEach(function (defect) {
        var analysis = byId[defect.defect_id];
        defect.expert_conclusion.text = analysis.basis.trim();
        defect.severity_reason = analysis.severity_reason.trim();
        defect.pedestrian_risk = yesNoRisk(analysis.pedestrian_risk);
        defect.treatment_advice = sampleStyleAdvice(defect.analysis_input || defect);
        defect.expert_conclusion.source_version = "intern-s2-preview-397b";
      });
    });
  }

  function setGenerationProgress(percent, text) {
    generationProgress.hidden = false;
    generationProgress.textContent = text + " · " + Math.max(0, Math.min(100, percent)) + "%";
  }

  function severityLevel(value) {
    if (/严重|重度/.test(value || "")) return "serious";
    if (/中度|一般/.test(value || "")) return "general";
    return "minor";
  }

  function importFolderDataset() {
    if (!metaInput.files.length || !evidenceInput.files.length || !maskInput.files.length || !mapInput.files.length) return;
    Promise.all([
      Promise.all(Array.prototype.filter.call(metaInput.files, function (file) { return /_defects\\.json$/i.test(file.name); }).map(readText)),
      imageMap(evidenceInput.files), imageMap(maskInput.files), imageMap(mapInput.files)
    ]).then(function (payload) {
      var metadata = payload[0].map(function (text) { return JSON.parse(text); });
      var defects = [];
      metadata.forEach(function (document) { (document.defects || []).forEach(function (item) {
        var stem = (item.crop_name || item.filename || "").replace(/\\.[^.]+$/, "");
        var calculated = analysisText(item);
        defects.push({
          defect_id: "D-" + String(item.global_id || defects.length + 1).padStart(3, "0"), building_id: "Building_76", facade_id: "待确认", category_id: item.class_name || "待确认", severity: severityLevel(item.severity),
          captured_at: item.photo_time || "待补充", gps_latitude: (item.latitude_raw || "待补充") + " " + (item.latitude_ref || ""), gps_longitude: (item.longitude_raw || "待补充") + " " + (item.longitude_ref || ""), capture_height: item.altitude ? item.altitude + " m" : "待补充", pedestrian_risk: yesNoRisk(item.pedestrian_risk),
          analysis_input: { class_id: item.class_id, class_name: item.class_name, description: item.description, width: item.width, height: item.height, severity_label: item.severity },
          treatment_advice: calculated.advice, severity_reason: calculated.severity,
          reference_images: [payload[3][item.map_name], payload[1][item.crop_name || item.filename], payload[2][stem + "_mask.png"], payload[2][stem + "_vis.jpg"]].filter(Boolean),
          expert_conclusion: { status: "frozen", frozen_at: new Date().toISOString(), source_version: "meta-json/v1+report-tools-rules", text: calculated.basis },
          evidence: [{ evidence_id: "E-" + String(item.global_id || defects.length + 1), state: "measured", source: "_meta", period: "当前导入", version: "meta-json/v1", kind: "image", approved_redaction: true, caption: item.crop_name || item.filename || "缺陷证据", image_uri: payload[1][item.crop_name || item.filename] || "" }]
        });
      }); });
      report = { schema_version: "report-document/v1", report_id: "import-" + Date.now(), report_version: "web-import-1", frozen_at: new Date().toISOString(), project: { project_id: "Building_76", name: "Building_76 外墙检测鉴定", period: "当前导入", source_version: "_meta", location: "待补充", client: "待补充", overview: "由 _meta 缺陷识别结果及三类图片文件夹生成。", method: "基于缺陷识别元数据与关联图片生成。", responsibility: { inspector: "待人工确认", author: "待人工确认", reviewer: "待人工确认", approver: "待人工确认" } }, field_catalog: [], sections: [], defects: defects };
      evidenceImages = Object.keys(payload[1]).map(function (key) { return { name: key, uri: payload[1][key] }; });
      sampleEvidenceLoaded = false;
      result.hidden = true;
      fileList.innerHTML = "<ul><li>已导入 " + defects.length + " 条缺陷元数据。</li><li>图片关联：原始图 " + Object.keys(payload[1]).length + " 张、掩码 " + Object.keys(payload[2]).length + " 张、位置图 " + Object.keys(payload[3]).length + " 张。</li><li>生成预览时：书生模型生成判定依据、严重程度依据和行人风险；模型判断影响较小或低风险时显示“否”，处理建议按固定分档生成。</li></ul>";
      renderChecks();
    }).catch(function () { checks.innerHTML = '<div class="check bad">文件夹导入失败：请确认四个文件夹完整且 _meta 中 JSON 格式正确。</div>'; });
  }

  reportInput.addEventListener("change", function () {
    sampleEvidenceLoaded = false;
    renderFiles();
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { load(reader.result); };
    reader.readAsText(file, "utf-8");
  });
  evidenceInput.addEventListener("change", function () {
    sampleEvidenceLoaded = false;
    renderFiles();
    var imageFiles = Array.prototype.filter.call(this.files || [], function (file) { return file.type.indexOf("image/") === 0; });
    Promise.all(imageFiles.map(readImage)).then(function (images) {
      evidenceImages = images;
      attachEvidenceImages();
      renderChecks();
    }).catch(function () {
      evidenceImages = [];
      checks.innerHTML = '<div class="check bad">证据图片读取失败，请重新选择图片文件。</div>';
      generate.disabled = true;
    });
  });
  [metaInput, evidenceInput, maskInput, mapInput].forEach(function (input) { input.addEventListener("change", importFolderDataset); });
  attachmentInput.addEventListener("change", renderFiles);
  sample.addEventListener("click", loadSample);
  generate.addEventListener("click", function () {
    generate.disabled = true;
    setGenerationProgress(0, "正在准备报告数据");
    enrichWithAiAnalysis().then(function () {
      persistGeneratedReport();
      setPhase(3);
      readiness.textContent = "网页预览已生成";
      result.hidden = false;
      setGenerationProgress(100, "网页报告预览已生成");
      document.getElementById("result-copy").textContent = "书生模型已生成判定依据、严重程度依据和行人风险；处理建议按固定分档生成。";
      result.scrollIntoView({ behavior: "smooth", block: "center" });
    }).catch(function (error) {
      renderChecks();
      readiness.textContent = "未生成";
      readiness.style.color = "#a63b32";
      generationProgress.textContent = "生成失败 · 0%";
      checks.innerHTML = '<div class="check bad">无法生成报告：' + escText(error.message) + "</div>";
    });
  });

  setPhase(1);
}());

