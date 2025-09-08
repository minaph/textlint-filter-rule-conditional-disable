import type { TextlintRuleModule } from "@textlint/types";
import { matchPatterns } from "@textlint/regexp-string-matcher";
import { DIRECTIVE_RE, lineRangeAfter, splitRules } from "textlint-conditional-disable-module";

const rule: TextlintRuleModule = (context) => {
  const { Syntax, getSource, report, RuleError, locator } = context;

  return {
    [Syntax.Document](node) {
      const text = getSource(node);
      if (!text) return;
      const directiveRE = DIRECTIVE_RE();

      directiveRE.lastIndex = 0;

      for (let m; (m = directiveRE.exec(text)); ) {
        const rawRules = m[1]; // "ruleA,ruleB" or "*" など
        const pattern = m[2];  // "/.../flags"
        const directiveRange: [number, number] = [m.index, m.index + m[0].length];

        const line = lineRangeAfter(text, directiveRange[1]);
        if (!line) {
          const ruleIds = splitRules(rawRules);
          const disableAll = ruleIds.length === 1 && ruleIds[0] === "*";
          const detail = `rules=[${ruleIds.join(", ")}] disableAll=${disableAll} nextLine=<none>`;
          report(
            node,
            new RuleError(
              `conditional-disable: 次の行がみつかりませんでした (${detail})`,
              { padding: locator.range(directiveRange) }
            )
          );
          continue;
        }

        const [lineStart, lineEnd] = line;
        const targetLine = text.slice(lineStart, lineEnd);
        const matches = matchPatterns(targetLine, [pattern]);

        if (matches.length === 0) {
          const ruleIds = splitRules(rawRules);
          const disableAll = ruleIds.length === 1 && ruleIds[0] === "*";
          const preview = targetLine.length > 120 ? `${targetLine.slice(0, 117)}...` : targetLine;
          const detail = `rules=[${ruleIds.join(", ")}] disableAll=${disableAll} nextLine=${JSON.stringify(preview)}`;
          report(
            node,
            new RuleError(
              `conditional-disable: 指定パターン ${pattern} は次の行に一致しません (${detail})`,
              { padding: locator.range(directiveRange) }
            )
          );
        }
        // マッチ時は何もしない（抑制はfilter側が同一範囲に対して行う）
      }
    }
  };
};

export default rule;
module.exports = rule; // CJS 互換


