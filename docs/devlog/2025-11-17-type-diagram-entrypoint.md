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
