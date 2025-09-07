// test/index.test.ts
import assert from "node:assert/strict";
import { TextLintCore } from "@textlint/legacy-textlint-core";
import markdown from "@textlint/textlint-plugin-markdown";
import noTodo from "textlint-rule-no-todo";
// フィルタは src を直接読み込む（ts-mocha 実行時にTSを解決）
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import conditionalDisable from "../src/index";

async function lintMarkdown(text: string) {
  const core = new TextLintCore();
  core.setupPlugins({ markdown });
  core.setupRules({ "no-todo": noTodo });
  core.setupFilterRules({ "conditional-disable": conditionalDisable as any });
  return core.lintText(text, ".md");
}

describe("textlint-filter-rule-conditional-disable", () => {
  it("次行の '- [ ]' にだけ no-todo を無効化できる", async () => {
    const text =
      "<!-- disable no-todo for /- \\[ \\]/ -->\n" +
      "- [ ] this list item looks like TODO but should be allowed";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 0);
  });

  it("スコープ外の行は通常どおり（エラーなしのテキスト）", async () => {
    const text = "This line has no TODO-like pattern.";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 0);
  });

  it("未マッチのディレクティブでは抑止されず、次行は通常どおり検出される", async () => {
    const text = "<!-- disable no-todo for /NOTHING/ -->\n- [ ] string";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 1);
  });

  it("次行のみ無効化され、以降の行は検出される", async () => {
    const text =
      "<!-- disable no-todo for /- \\[ \\]/ -->\n" +
      "- [ ] allowed by filter\n\n" +
      "- [ ] should be reported";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].line, 4);
    assert.equal(messages[0].column, 3);
  });

  // 追加 1: '*' 指定で未マッチ時でも、対象行に検出対象が無ければ0件
  it("'*' 指定でパターン未マッチでも、対象行に検出対象が無ければメッセージは0件", async () => {
    const text = "<!-- disable * for /NOTHING/ -->\nThis is a line";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 0);
  });

  // 追加 2: 複数ディレクティブのうち2つ目が未マッチなら、その次行は検出される
  it("複数ディレクティブのうち2つ目が未マッチなら、その次行は検出される", async () => {
    const text = [
      "<!-- disable no-todo for /- \\[ \\]/ -->",
      "- [ ] allowed by first directive",
      "<!-- disable no-todo for /NOTHING/ -->",
      "- [ ] this will cause error due to second directive"
    ].join("\n");
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 1);
  });

  // 追加 3: '*' 指定でマッチ時は全ルール抑止される
  it("'*' 指定でマッチ時は全ルールが抑止される", async () => {
    const text =
      "<!-- disable * for /- \\[ \\]/ -->\n" +
      "- [ ] this list item looks like TODO but should be allowed";
    const { messages } = await lintMarkdown(text);
    assert.equal(messages.length, 0);
  });
});