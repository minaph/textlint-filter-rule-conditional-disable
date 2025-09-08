import type { TextlintFilterRuleModule } from "@textlint/types";
import { matchPatterns } from "@textlint/regexp-string-matcher";
import {
  DIRECTIVE_RE,
  lineRangeAfter,
  splitRules,
} from "textlint-conditional-disable-module";

const reporter: TextlintFilterRuleModule = (context) => {
  const { Syntax, getSource, shouldIgnore } = context;

  return {
    [Syntax.Document](node) {
      const text = getSource(node);
      if (!text) return;
      const directiveRE = DIRECTIVE_RE();

      // /g の状態をリセット
      directiveRE.lastIndex = 0;

      for (let m; (m = directiveRE.exec(text)); ) {
        const rawRules = m[1]; // "ruleA,ruleB" or "*" など
        const pattern = m[2]; // "/.../flags"

        // ディレクティブ自体の占有範囲を全ルールから保護
        const directiveStart = m.index;
        const directiveEnd = m.index + m[0].length;
        shouldIgnore([directiveStart, directiveEnd], { ruleId: "*" } as any);

        const line = lineRangeAfter(text, m.index + m[0].length);
        if (!line) continue;
        const [lineStart, lineEnd] = line;
        const targetLine = text.slice(lineStart, lineEnd);

        // targetLine 内の一致範囲（相対オフセット）を列挙
        const matches = matchPatterns(targetLine, [pattern]);
        if (!matches.length) {
          // 未マッチ時はフィルタ側では何もしない（エラーはルール側がreport）
          continue;
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
    },
  };
};

export default reporter;
module.exports = reporter; // CJS 互換
