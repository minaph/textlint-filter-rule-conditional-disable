
# textlint-filter-rule-conditional-disable

**Filter rule for textlint** that allows you to disable specific rule(s) **only for the next line's matching part based on a regular expression**.

---

## 目的（Why）

- textlint のルールは、文章品質向上には欠かせませんが、例外を柔軟に扱いたい場面もあります。
- 既存の `textlint-filter-rule-comments` は「すべてのルールをブロック単位で無効化」するため、「次の行の特定パターンだけ回避」という精緻な制御には向いていません。
- そこで登場するのが本フィルタ。  
  > **次の行の指定パターンにマッチする箇所だけ、指定したルールの適用を無効化する**  
  という、きめ細やかな脱出ハッチを実現します。

---

## 使い方（Usage）

### .textlintrc での有効化

```jsonc
{
  "filters": {
    "conditional-disable": true
  }
}
````

### マークダウン内での指示書き例

```markdown
<!-- disable no-todo for /TODO(\\s*[:：].*)?/i -->
TODO: ここだけ意図的に残す
```

* 上記例では、**`no-todo` ルール**の適用を、**次の行の「TODO: ...」全体**に対して無効化します。
* スラッシュ形式の正規表現を用いることで、対象文字列を柔軟に指定できます。
* 複数ルールを対象にする場合は `disable ruleA,ruleB for /.../` のようにコンマ区切りで指定。
* ワイルドカード `*` を使って「すべてのルール」を一時的に無効化することも可能です。

---

## 実装概要

* **テキスト全体をスキャン**し、`<!-- disable <RULES> for /REGEX/ -->` の指示ディレクティブを検出。
* 指定されたディレクティブの**直後の行**を対象に、regex マッチした部分の**開始〜終了オフセット**を計算。
* `context.shouldIgnore([start, end], { ruleId })` を使って、**その範囲の該当ルールをスキップ**させます。
* RegExp-like 文字列の解釈には、`@textlint/regexp-string-matcher` を利用し、既存 `allowlist` フィルタとの一貫性を担保。([textlint.org][1], [npm][2])

---

## 利点と差別化

| 機能       | textlint-filter-rule-comments                       | 本フィルタ（conditional-disable） |
| -------- | --------------------------------------------------- | -------------------------- |
| 範囲指定の粒度  | ブロック／パラグラフ単位                                        | 「次の行」の特定マッチ部分のみ            |
| ルール単位の指定 | 全ルール or 指定ルール                                       | ✓ 指定ルールのみ or `*` で全ルール     |
| 実装の柔軟性   | 行区切りの制約あり（Markdown）([GitHub][3], [textlint.org][4]) | 行区切りの曖昧さを排除し、直後行を明確に狙い打ち可能 |

---

## 開発／テスト状況

* **実装**は TypeScript で約 120〜150 行、テストを含め総コード量は 260〜400 行規模です。
* **テスト**は `textlint-tester`（複数ルール＋filterRules対応）を使い、E2E で挙動検証を実施しました。
* フィルタ自体のユースケースに合わせたテスト例：

  * 一致箇所のみ抑止されること
  * 指定ルールのみ抑止、他ルールは残ること
  * 正規表現のパターンマッチ状況による動作差分

---

## 制限事項と注意点

1. **ルールIDの一致性**
   指定する ruleId は、実際に textlint が報告する ID と**完全一致**している必要があります。

2. **コメントの書き方制限**
   Markdown のような構文では `<!-- ... -->` の前後に空行が必要な場合がありますが、本フィルタは生テキスト全体から走査するため、この制約は影響しません。([Zenn][5])

3. **正規表現エスケープ**
   `/\d/` のような記号を文字列内で使う場合は、JSON等では `"/\\d/"` のように**エスケープ**が必要です。これは `allowlist` フィルタでも同様です。([npm][2], [クラスメソッド発「やってみた」系技術メディア | DevelopersIO][6])

4. **パフォーマンス**
   通常の文章や技術文書のスケールであれば、1 ドキュメントあたり数ミリ秒で処理可能な軽量実装ですが、巨大ファイルでは走査回数に応じて遅くなる可能性があります。

---

## 今後の拡張案

* `disable-next-line` の別形式サポート（コメントディレクティブの書き味）
* スコープ範囲の拡張（例えば「次の N 行」や「次の段落」）
* 正規表現を複数の条件に対応させて複雑なマッチルールを扱うなど

---

## ライセンス

MIT License — 誰でも自由に修正・利用・配布可能です。

---

## 参考リンク

* **textlint Filter Rule API**: `shouldIgnore(range, { ruleId })` など。([textlint.org][1])
* **textlint-filter-rule-allowlist**: RegExp-like String の仕様と使い方の参考。([npm][2])
* **textlint-filter-rule-comments**: 既存のコメントベース抑止事例と制約。([GitHub][3], [textlint.org][4])




[1]: https://textlint.org/docs/filter-rule/?utm_source=chatgpt.com "Creating Filter Rule | textlint"
[2]: https://www.npmjs.com/package/textlint-filter-rule-allowlist?utm_source=chatgpt.com "textlint-filter-rule-allowlist"
[3]: https://github.com/textlint/textlint-filter-rule-comments?utm_source=chatgpt.com "textlint filter rule that disables all rules between comments ..."
[4]: https://textlint.org/docs/ignore/?utm_source=chatgpt.com "Ignoring Text | textlint"
[5]: https://zenn.dev/3w36zj6/scraps/db6d14bdab8cd3?utm_source=chatgpt.com "MDXでtextlintを使うときのコメント構文の扱い"
[6]: https://dev.classmethod.jp/articles/how-to-ignore-in-textlint/?utm_source=chatgpt.com "textlintで正規表現を使って特定範囲を無視させる方法"
