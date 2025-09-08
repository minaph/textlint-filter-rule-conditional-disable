textlintにおける`DocumentExit`は、AST（抽象構文木）のトラバーサルにおいて、ルートノードである`Document`ノードの処理が完了した直後、つまり「離脱時（Exit）」に呼び出されるイベントです。

---

### 🔍 `DocumentExit`とは？

textlintのルールは、ASTを深さ優先でトラバースし、各ノードの「入場時（Enter）」と「離脱時（Exit）」に対応するハンドラを定義できます。

* `Document`：ドキュメントのルートノードに入ったときに呼び出される。
* `DocumentExit`：ドキュメントの全ノードの処理が完了し、ルートノードから離れるときに呼び出される。

この仕組みにより、特定のノードの処理が終わった後に実行したい処理（例：全体の整合性チェックや集計処理）を`DocumentExit`で行うことができます。

---

### 🛠 ルールでの使用例

以下は、`DocumentExit`を使用してドキュメント全体のチェックを行うルールの例です：

```javascript
export default function (context) {
    const { Syntax, report, RuleError } = context;
    let strCount = 0;

    return {
        [Syntax.Str](node) {
            strCount++;
        },
        [Syntax.DocumentExit]() {
            if (strCount > 1000) {
                report(null, new RuleError("ドキュメント内の文字数が多すぎます"));
            }
        }
    };
}
```

この例では、`Str`ノード（テキストノード）の数をカウントし、ドキュメント全体での文字数が1000を超えた場合に警告を出しています。

---

### 📚 AST構造とノードタイプ

textlintのAST（TxtAST）は、以下のようなノードタイプを持ちます：

* `Document` / `DocumentExit`
* `Paragraph` / `ParagraphExit`
* `Str` / `StrExit`
* `Header` / `HeaderExit`
* `Link` / `LinkExit`
* `CodeBlock` / `CodeBlockExit`
* `Table` / `TableExit`（textlint v13以降）

各ノードタイプは、`@textlint/ast-node-types`パッケージで定義されており、ルール内で`context.Syntax`を通じてアクセスできます。

---

### 🧪 ASTの理解を深めるためのツール

ASTの構造を視覚的に理解するには、以下のツールが役立ちます：

* [AST Explorer for textlint](https://textlint.org/)
* [visualize-txt-traverse](https://github.com/azu/visualize-txt-traverse)

これらのツールを使用することで、実際のテキストがどのようなAST構造になるのかを確認できます。

---

`DocumentExit`は、ドキュメント全体の処理が完了した後に実行されるため、全体の整合性チェックや集計処理などに適しています。ルール作成時には、`DocumentExit`を活用して、より高度なテキストチェックを実現できます。
