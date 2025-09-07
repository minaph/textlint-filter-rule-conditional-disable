// test/index.test.ts
const assert = require("node:assert/strict");
const { TextLintCore } = require("@textlint/legacy-textlint-core");
const markdown = require("@textlint/textlint-plugin-markdown").default;
const noTodo = require("textlint-rule-no-todo").default;
// ビルド成果物を参照（lib/index.js）
const conditionalDisable = require("../lib/index.js");

async function lintMarkdown(text: string) {
  const core = new TextLintCore();
  core.setupPlugins({ markdown });
  core.setupRules({ "no-todo": noTodo });
  core.setupFilterRules({ "conditional-disable": conditionalDisable });
  return core.lintText(text, ".md");
}

async function main() {
  // valid 1: 次の行の '- [ ]' にだけ no-todo を無効化
  {
    const text =
      "<!-- disable no-todo for /- \\[ \\]/ -->\n" +
      "- [ ] this list item looks like TODO but should be allowed";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 0, "filter should suppress no-todo for the next line match");
  }

  // valid 2: 別の行（スコープ外）は通常どおり通る（エラーが無いテキスト）
  {
    const text = "This line has no TODO-like pattern.";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 0);
  }

  // invalid 1: パターンがマッチしない指示は抑制しない
  {
    const text = "<!-- disable no-todo for /NOTHING/ -->\n- [ ] string";
    const { messages } = await lintMarkdown(text);
    assert.ok(messages.length >= 1, "no-todo should report when pattern does not match");
    // 位置の一例（実装差異に依存するため厳密比較はしないが、先頭の1件は2行3列付近のはず）
    assert.equal(messages[0].line, 2);
    assert.equal(messages[0].column, 3);
  }

  // invalid 2: 次の行のみ無効化され、それ以降の行は通常どおり検出される
  {
    const text =
      "<!-- disable no-todo for /- \\[ \\]/ -->\n" +
      "- [ ] allowed by filter\n\n" +
      "- [ ] should be reported";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 1, "only later occurrence should be reported");
    assert.equal(messages[0].line, 4);
    assert.equal(messages[0].column, 3);
  }

  // 簡易完了表示
  // eslint-disable-next-line no-console
  console.log("All tests passed.");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});