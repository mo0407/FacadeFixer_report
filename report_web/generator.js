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
  var sample = document.getElementById("load-sample");
  var metaInput = document.getElementById("meta-files");
  var maskInput = document.getElementById("mask-files");
  var mapInput = document.getElementById("map-files");
  var report = null;
  var sampleEvidenceLoaded = false;
  var evidenceImages = [];
  var phase = 1;

  function setPhase(nextPhase) {
    phase = nextPhase;
  }

  function item(ok, text) {
    return '<div class="check ' + (ok ? "ok" : "bad") + '">' + text + "</div>";
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
      var sampleRoot = "file:///E:/ai/%E4%BD%8E%E7%A9%BA/%E6%A3%80%E6%B5%8B%E6%8A%A5%E5%91%8A/Building_76/";
      var sampleIds = ["DJI_20240930101210_0004_V_0_43_173_0_c5", "DJI_20240930101210_0004_V_0_43_173_1_c5", "DJI_20240930101652_0045_V_0_57_869_1_c5"];
      data.project.responsibility = { inspector: "张三、李四", author: "王五", reviewer: "赵六", approver: "孙七" };
      data.defects.forEach(function (defect, index) {
        var imageId = sampleIds[index];
        defect.reference_images = [sampleRoot + "single_defect_maps/" + imageId + "_map.jpg", sampleRoot + "defects/" + imageId + ".jpg", sampleRoot + "defect_masks/" + imageId + "_mask.png", sampleRoot + "defect_masks/" + imageId + "_vis.jpg"];
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
        defects.push({
          defect_id: "D-" + String(item.global_id || defects.length + 1).padStart(3, "0"), building_id: "Building_76", facade_id: "待确认", category_id: item.class_name || "待确认", severity: severityLevel(item.severity),
          captured_at: item.photo_time || "待补充", gps_latitude: (item.latitude_raw || "待补充") + " " + (item.latitude_ref || ""), gps_longitude: (item.longitude_raw || "待补充") + " " + (item.longitude_ref || ""), capture_height: item.altitude ? item.altitude + " m" : "待补充", pedestrian_risk: item.pedestrian_risk || "待确认",
          ai_generation: { defect_reason: "待大模型生成并由人工复核", severity_reason: "待大模型生成并由人工复核", treatment_advice: "待大模型生成并由人工复核", pedestrian_risk: "待大模型生成并由人工复核" },
          treatment_advice: item.advice || "待大模型生成并由人工复核", severity_reason: "待大模型生成并由人工复核",
          reference_images: [payload[3][item.map_name], payload[1][item.crop_name || item.filename], payload[2][stem + "_mask.png"], payload[2][stem + "_vis.jpg"]].filter(Boolean),
          expert_conclusion: { status: "frozen", frozen_at: new Date().toISOString(), source_version: "meta-json/v1", text: item.description || "待大模型生成并由人工复核" },
          evidence: [{ evidence_id: "E-" + String(item.global_id || defects.length + 1), state: "measured", source: "_meta", period: "当前导入", version: "meta-json/v1", kind: "image", approved_redaction: true, caption: item.crop_name || item.filename || "缺陷证据", image_uri: payload[1][item.crop_name || item.filename] || "" }]
        });
      }); });
      report = { schema_version: "report-document/v1", report_id: "import-" + Date.now(), report_version: "web-import-1", frozen_at: new Date().toISOString(), project: { project_id: "Building_76", name: "Building_76 外墙检测鉴定", period: "当前导入", source_version: "_meta", location: "待补充", client: "待补充", overview: "由 _meta 缺陷识别结果及三类图片文件夹生成。", method: "基于缺陷识别元数据与关联图片生成。", responsibility: { inspector: "待人工确认", author: "待人工确认", reviewer: "待人工确认", approver: "待人工确认" } }, field_catalog: [], sections: [], defects: defects };
      evidenceImages = Object.keys(payload[1]).map(function (key) { return { name: key, uri: payload[1][key] }; });
      sampleEvidenceLoaded = false;
      result.hidden = true;
      fileList.innerHTML = "<ul><li>已导入 " + defects.length + " 条缺陷元数据。</li><li>图片关联：原始图 " + Object.keys(payload[1]).length + " 张、掩码 " + Object.keys(payload[2]).length + " 张、位置图 " + Object.keys(payload[3]).length + " 张。</li><li>判断依据、严重程度依据、处理建议和行人风险已标记为 AI 生成后人工复核字段。</li></ul>";
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
    persistGeneratedReport();
    setPhase(3);
    readiness.textContent = "网页预览已生成";
    result.hidden = false;
    document.getElementById("result-copy").textContent = "已生成当前 ReportDocument 的完整网页数据报告。它是复核预览，不代表正式签署或发布。";
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  setPhase(1);
}());

