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
    var evidenceOk = evidenceInput.files.length > 0 || sampleEvidenceLoaded;
    var evidenceText = sampleEvidenceLoaded ? "已载入内置的已批准脱敏示例证据" : "已提交批准脱敏证据文件";
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
      var sampleImages = [
        "file:///E:/ai/%E4%BD%8E%E7%A9%BA/%E6%A3%80%E6%B5%8B%E6%8A%A5%E5%91%8A/Building_76/defects/DJI_20240930101210_0004_V_0_43_173_0_c5.jpg",
        "file:///E:/ai/%E4%BD%8E%E7%A9%BA/%E6%A3%80%E6%B5%8B%E6%8A%A5%E5%91%8A/Building_76/defects/DJI_20240930101210_0004_V_0_43_173_1_c5.jpg",
        "file:///E:/ai/%E4%BD%8E%E7%A9%BA/%E6%A3%80%E6%B5%8B%E6%8A%A5%E5%91%8A/Building_76/defects/DJI_20240930101210_0004_V_0_43_173_2_c5.jpg"
      ];
      data.project.responsibility = { inspector: "张三、李四", author: "王五", reviewer: "赵六", approver: "孙七" };
      data.defects.forEach(function (defect, index) {
        defect.evidence.forEach(function (evidence) {
          evidence.approved_redaction = true;
          if (evidence.kind === "image") evidence.image_uri = sampleImages[index] || "";
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
    (report.defects || []).forEach(function (defect) {
      (defect.evidence || []).forEach(function (evidence) {
        if (evidence.kind === "image" && evidenceImages[imageIndex]) {
          evidence.image_uri = evidenceImages[imageIndex].uri;
          evidence.caption = evidence.caption || evidenceImages[imageIndex].name;
          imageIndex += 1;
        }
      });
    });
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

