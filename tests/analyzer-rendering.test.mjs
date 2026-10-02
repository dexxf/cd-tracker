import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

test("analyzer findings retain cause, impact, and advice while escaping service content", () => {
  const source = readFileSync(new URL("../frontend/script/syntax-analyzer.js", import.meta.url), "utf8");
  const start = source.indexOf("    function updateErrorPanel()");
  const end = source.indexOf("    const data = readPendingAnalysis()", start);
  assert.ok(start >= 0 && end > start);
  const nodes = { errorList: {}, errorCount: {}, warningCount: {} };
  const context = {
    document: { getElementById(id) { return nodes[id]; } },
    currentErrors: [{
      line: "<img src=x onerror=alert(1)>",
      message: "<b>Syntax</b>", rule_id: "<svg/onload=alert(1)>",
      category: "unsafe<tag>", severity: "error",
      cause: "<script>cause</script>", impact: "A & B", recommendation: 'Use "quotes"'
    }],
    currentWarnings: [{ line: 5, message: "Warning", cause: "Missing check", impact: "May fail", recommendation: "Add a check" }]
  };
  vm.runInNewContext(`${source.slice(start, end)}\nupdateErrorPanel();`, context);
  const html = nodes.errorList.innerHTML;
  assert.equal(nodes.errorCount.textContent, 1);
  assert.equal(nodes.warningCount.textContent, 1);
  assert.match(html, /finding-card warning/);
  assert.match(html, /Cause:.*&lt;script&gt;cause&lt;\/script&gt;/s);
  assert.match(html, /Impact:.*A &amp; B/s);
  assert.match(html, /Recommended action:.*Use &quot;quotes&quot;/s);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;svg/);
  assert.doesNotMatch(html, /<(?:script|img|svg)\b/i);
});
