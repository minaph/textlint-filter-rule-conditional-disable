import assert from "node:assert/strict";
import { TextLintCore } from "@textlint/legacy-textlint-core";
import markdown from "@textlint/textlint-plugin-markdown";

import rule from "../src/conditional-disable-validate-directive";

async function lintMarkdown(text: string) {
  const core = new TextLintCore();
  core.setupPlugins({ markdown });
  core.setupRules({ "conditional-disable/validate-directive": rule });
  return core.lintText(text, ".md");
}


describe("rule: conditional-disable/validate-directive", () => {
  it("未マッチならディレクティブ定義範囲でreport（次行なし）", async () => {
    const text = "<!-- disable no-todo for /NOTHING/ -->"; // 次行がない
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 1);
    assert.match(messages[0].message, /次の行に一致しません/);
  });

  it("未マッチならディレクティブ定義範囲でreport（次行あり）", async () => {
    const text = "<!-- disable no-todo for /NOTHING/ -->\n- [ ]";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 1);
    assert.match(messages[0].message, /rules=\[no-todo\]/);
    assert.match(messages[0].message, /pattern=\/NOTHING\//);
  });

  it("'*' 指定で未マッチでもディレクティブ定義範囲でreport", async () => {
    const text = "<!-- disable * for /NOTHING/ -->\nThis is a line";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 1);
    assert.match(messages[0].message, /disableAll=true/);
  });

  it("マッチ時はreportされない（ディレクティブ自体は別途フィルタが抑制）", async () => {
    const text = [
      "<!-- disable no-todo for /- \\[ \\]/ -->",
      "- [ ] allowed by filter"
    ].join("\n");
    const { messages } = await lintMarkdown(text);
    // ルール単独では抑制されないが、マッチ時はこのルールはreportしない
    assert.equal(messages.length, 0);
  });

  it("複数ディレクティブ、1つ目未マッチ・2つ目マッチ → 未マッチのみreport", async () => {
    const text = [
      "<!-- disable no-todo for /NOTHING/ -->",
      "- [ ] line for first (no match)",
      "<!-- disable no-todo for /- \\[ \\]/ -->",
      "- [ ] line for second (match)"
    ].join("\n");
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 1);
    assert.match(messages[0].message, /pattern=\/NOTHING\//);
  });
});


