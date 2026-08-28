const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const preview = fs.readFileSync(path.join(root, "preview.html"), "utf8");
const generator = fs.readFileSync(path.join(root, "generator.html"), "utf8");
const generatorApp = fs.readFileSync(path.join(root, "generator.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const data = JSON.parse(fs.readFileSync(path.join(root, "report-data.example.json"), "utf8"));
if (!html.includes("generator.html") || !generator.includes("report-json") || !generator.includes("evidence-files") || !generatorApp.includes("facadefixer-generated-report") || !preview.includes("app.js") || !app.includes("report-data.example.json")) throw new Error("entry point is incomplete");
if (data.schema_version !== "report-document/v1") throw new Error("example must use ReportDocument v1");
["measured", "model_estimate", "inaccessible"].forEach(function (state) { if (!app.includes(state)) throw new Error("missing status renderer: " + state); });
if (!app.includes("window.print")) throw new Error("A4 print action missing");
console.log("report_web static contract passed");

