
// <!-- disable <RULES> for /REGEX/flags -->
// 例: <!-- disable no-todo for /TODO(\\s*[:：].*)?/i -->
export const DIRECTIVE_RE = /disable\s+([*@\w\-\/.,]+)\s+for\s+(\/(?:\\\/|[^\/])+\/[a-zA-Z]*)/g;/** 1行の [start,end) 絶対オフセットを返す */
export function lineRangeAfter(text: string, indexAfter: number): [number, number] | null {
  // 指定位置以降で、空行ではなく、ディレクティブを含まず、指定位置より後にある最初の行を返す
  let cursor = text.indexOf("\n", indexAfter);
  if (cursor === -1) return null;
  let lineStart = cursor + 1;
  while (lineStart <= text.length) {
    const nextEol = text.indexOf("\n", lineStart);
    const lineEnd = nextEol === -1 ? text.length : nextEol;
    const line = text.slice(lineStart, lineEnd);
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      // グローバルフラグの影響を避けるため毎回リセット
      DIRECTIVE_RE.lastIndex = 0;
      const hasDirective = DIRECTIVE_RE.test(line);
      if (!hasDirective) {
        return [lineStart, lineEnd];
      }
    }
    if (nextEol === -1) break;
    lineStart = nextEol + 1;
  }
  return null;
}
/** "a,b,c" → ["a","b","c"]（空白トリム） */
export function splitRules(s: string): string[] {
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}


