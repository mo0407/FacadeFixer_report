Warning: truncated output (original token count: 3637)
Total output lines: 91

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
  function locationMap(uri) {
    return String(uri || "").replace("assets/Building_76/single_defect_maps/", "assets/Building_76/location_maps_web/");
  }
  function photos(defect, number) {
    var evidence = defect.evidence || [];
    var images = (defect.reference_images || []).concat(evidence.map(function (item) { return item.image_uri; })).filter(function (uri, index, all) { return uri && all.indexOf(uri) === index; });
    var captions = ["缺陷在大图中的位置", "缺陷局部特写", "缺陷掩码（二值分割）", "缺陷掩码与原图叠加"];
    if (!images.length) return '<div class="photo-box"><div class="photo-placeholder">未提供可打印的证据图片</div…2637 tokens truncated…修缮施工时宜进一步查明缺陷范围并及时采取相应措施。</p><p>2）本报告仅对委托检测范围内容负责，未检测区域不代表无缺陷。</p><p>3）报告签署前，应核验责任信息、证据材料及版本状态。</p></section>' +
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

