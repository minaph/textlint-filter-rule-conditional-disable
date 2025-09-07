import type { TextlintRuleModule } from "@textlint/types";
import { matchPatterns } from "@textlint/regexp-string-matcher";

// <!-- disable <RULES> for /REGEX/flags -->
// 例: <!-- disable no-todo for /TODO(\\s*[:：].*)?/i -->
const DIRECTIVE_RE =
  /disable\s+([*@\w\-\/.,]+)\s+for\s+(\/(?:\\\/|[^\/])+\/[a-zA-Z]*)/g;

/** 1行の [start,end) 絶対オフセットを返す */
function lineRangeAfter(text: string, indexAfter: number): [number, number] | null {
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

const rule: TextlintRuleModule = (context) => {
  const { Syntax, getSource, report, RuleError, locator } = context;

  return {
    [Syntax.Document](node) {
      const text = getSource(node);
      if (!text) return;

      DIRECTIVE_RE.lastIndex = 0;

      for (let m; (m = DIRECTIVE_RE.exec(text)); ) {
        const rawRules = m[1]; // "ruleA,ruleB" or "*" など
        const pattern = m[2];  // "/.../flags"
        const directiveRange: [number, number] = [m.index, m.index + m[0].length];

        const line = lineRangeAfter(text, directiveRange[1]);
        if (!line) {
          const ruleIds = splitRules(rawRules);
          const disableAll = ruleIds.length === 1 && ruleIds[0] === "*";
          const detail = `rules=[${ruleIds.join(", ")}] disableAll=${disableAll} pattern=${pattern} nextLine=<none>`;
          report(
            node,
            new RuleError(
              `conditional-disable: 指定パターン ${pattern} は次の行に一致しません (${detail})`,
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
          const detail = `rules=[${ruleIds.join(", ")}] disableAll=${disableAll} pattern=${pattern} nextLine=${JSON.stringify(preview)} length=${targetLine.length}`;
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


