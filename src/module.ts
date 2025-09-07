
// <!-- disable <RULES> for /REGEX/flags -->
// 例: <!-- disable no-todo for /TODO(\\s*[:：].*)?/i -->
export const DIRECTIVE_RE = /disable\s+([*@\w\-\/.,]+)\s+for\s+(\/(?:\\\/|[^\/])+\/[a-zA-Z]*)/g;/** 1行の [start,end) 絶対オフセットを返す */
export function lineRangeAfter(text: string, indexAfter: number): [number, number] | null {
  // コメント終端の次の改行を探す（コメント行をスキップ）
  const eolOfComment = text.indexOf("\n", indexAfter);
  if (eolOfComment === -1) return null;
  const lineStart = eolOfComment + 1;
  const nextEol = text.indexOf("\n", lineStart);
  const lineEnd = nextEol === -1 ? text.length : nextEol;
  return [lineStart, lineEnd];
}
/** "a,b,c" → ["a","b","c"]（空白トリム） */
export function splitRules(s: string): string[] {
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}


