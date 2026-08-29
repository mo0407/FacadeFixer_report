Warning: truncated output (original token count: 5905)
Total output lines: 401

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
     …4905 tokens truncated… = this.files[0];
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

