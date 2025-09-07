import type { TextlintFilterRuleModule } from "@textlint/types";
import { matchPatterns } from "@textlint/regexp-string-matcher";

// <!-- disable <RULES> for /REGEX/flags -->
// 例: <!-- disable no-todo for /TODO(\\s*[:：].*)?/i -->
const DIRECTIVE_RE =
  /disable\s+([*@\w\-/.,]+)\s+for\s+(\/(?:\\\/|[^/])+\/[a-zA-Z]*)/g;

/** 1行の [start,end) 絶対オフセットを返す */
function lineRangeAfter(text: string, indexAfter: number): [number, number] | null {
  // コメント終端の次の改行を探す（コメント行をスキップ）
  const eolOfComment = text.indexOf("\n", indexAfter);
  if (eolOfComment === -1) return null;
  const lineStart = eolOfComment + 1;
  const nextEol = text.indexOf("\n", lineStart);
  const lineEnd = nextEol === -1 ? text.length : nextEol;
  return [lineStart, lineEnd];
}

/** "a,b,c" → ["a","b","c"]（空白トリム） */
function splitRules(s: string): string[] {
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}

const reporter: TextlintFilterRuleModule = (context) => {
  const { Syntax, getSource, shouldIgnore, RuleError, locator } = context;

  return {
    [Syntax.Document](node) {
      const text = getSource(node);
      if (!text) return;

      // /g の状態をリセット
      DIRECTIVE_RE.lastIndex = 0;

      for (let m; (m = DIRECTIVE_RE.exec(text)); ) {
        const rawRules = m[1]; // "ruleA,ruleB" or "*" など
        const pattern = m[2];  // "/.../flags"

        const line = lineRangeAfter(text, m.index + m[0].length);
        if (!line) continue;
        const [lineStart, lineEnd] = line;
        const targetLine = text.slice(lineStart, lineEnd);

        // targetLine 内の一致範囲（相対オフセット）を列挙
        const matches = matchPatterns(targetLine, [pattern]);
        if (!matches.length) {
          // 指定パターンが次行にヒットしない場合はエラーを投げる（位置はドキュメント先頭からの相対）
          throw new RuleError(
            `conditional-disable: 指定パターン ${pattern} は次の行に一致しません`,
            { padding: locator.range([m.index, m.index + m[0].length]) }
          );
        }

        const ruleIds = splitRules(rawRules);
        const disableAll = ruleIds.length === 1 && ruleIds[0] === "*";

        for (const mk of matches) {
          const absStart = lineStart + mk.startIndex;
          const absEnd = lineStart + mk.endIndex;

          if (disableAll) {
            shouldIgnore([absStart, absEnd], { ruleId: "*" } as any); // 全ルール抑止
          } else {
            for (const ruleId of ruleIds) {
              shouldIgnore([absStart, absEnd], { ruleId });
            }
          }
        }
      }
    }
  };
};

export default reporter;
module.exports = reporter; // CJS 互換
