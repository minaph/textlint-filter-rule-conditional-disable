const TextLintTester =
  require("textlint-tester").default || require("textlint-tester");
const markdown = require("@textlint/textlint-plugin-markdown").default;
const noTodo = require("textlint-rule-no-todo").default;
console.log({noTodo, markdown})
// フィルタルール（あなたの実装に合わせてパス調整）
const conditionalDisable = require("../lib/index.js"); // CJS 出力例

const tester = new TextLintTester();

/**
 * ポイント
 * - plugins: Markdown を有効化（HTMLコメントをパースするため）
 * - rules: フィルタの対象となる通常ルール（例: no-todo）
 * - filterRules: 今回実装したフィルタルールを読み込む
 *
 * textlint-tester の第2署名 run(testName, testConfig, cases) を使用
 */
tester.run(
  "filter:disable [RULE] for /REGEX/ (next line scoped)",
  {
    plugins: [{ pluginId: "markdown", plugin: markdown }],
    rules: [{ ruleId: "no-todo", rule: noTodo }],
    // ⚠ 一部の型定義には記載が薄いですが、textlint の descriptor と同様に filterRules を受け付けます
    filterRules: [{ ruleId: "conditional-disable", rule: conditionalDisable }],
  },
  {
    valid: [
      {
        description: "次の行の '- [ ]' にだけ no-todo を無効化",
        ext: ".md",
        text:
          "<!-- disable no-todo for /\\- \\[ \\]/ -->\n" +
          "- [ ] this list item looks like TODO but should be allowed",
      },
      {
        description: "別の行（スコープ外）は通常どおり通る（エラーが無いテキスト）",
        ext: ".md",
        text: "This line has no TODO-like pattern.",
      },
    ],
    invalid: [
      {
        description: "パターンがマッチしない指示は抑制しない",
        ext: ".md",
        text: "<!-- disable no-todo for /NOTHING/ -->\n- [ ] string",
        // message 比較は安定性のため省略し、位置のみをアサート
        errors: [{ line: 2, column: 3 }],
      },
      {
        description: "次の行のみ無効化され、それ以降の行は通常どおり検出される",
        ext: ".md",
        text:
          "<!-- disable no-todo for /\\- \\[ \\]/ -->\n" +
          "- [ ] allowed by filter\n\n" +
          "- [ ] should be reported",
        errors: [{ line: 4, column: 3 }],
      },
    ],
  }
);
