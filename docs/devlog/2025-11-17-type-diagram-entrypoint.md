# 2025-11-17 TypeDiagram エントリポイント名称変更

## 背景と目的
- DSL のエントリポイント `TypedDiagram` を `TypeDiagram` に改名して、ドメインで用いている名称と揃える。
- リリース前のため互換 API は不要。実装・ドキュメント一式を新名称に合わせて更新する。

## 実施内容
- `src/dsl/diagram_builder.ts` で公開関数名と JSDoc を `TypeDiagram` に変更。
- `src/index.ts` のエクスポートやテスト、tsd の型定義、example スクリプト、README、各種 design ドキュメント／devlog を一括で `TypeDiagram` にリネーム。
- `bun test` を実行して既存テストが成功することを確認。

## メモ
- 既存の `TypedDiagram` 参照は `rg -l "TypedDiagram"` で洗い出し、まとめて置換した。残件なし。
- エイリアス導入は不要と判断。

---

# 2025-11-17 Core TextSymbol PoC

## 背景
- CorePlugin でテキストのみのシンボルを扱えるようにし、複数行テキストでも崩れないかを検証したい。

## 実施内容
- `TextSymbol` クラスを作成し、`el.core.text()` で改行を含むラベルを SVG `<tspan>` で描画できるようにした。
- 行数と最長行の文字数から概算したサイズを `getDefaultSize()` で返し、レイアウト solver に渡す。
- `example/core_text_poc.ts` でシングルライン／複数行／空行／長文を作成し、出力した `example/core_text_poc.svg` を目視で確認。幅・高さが意図通りに確保され、テキストがはみ出さないことを確認。

## 追加改善
- `el.core.text()` に `TextInfo` を受け付けるよう拡張し、`textAnchor` / `fontSize` / `fontFamily` / `textColor` / `lineHeightFactor` を個別に上書きできるようにした。
- テーマスタイルにオーバーライドをマージする実装に変更し、左揃え (`textAnchor: "start"`) の場合は padding 起点で描画されるため `hint.alignLeft()` が視覚的にも期待通りになることを確認。
