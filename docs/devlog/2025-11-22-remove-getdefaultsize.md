# 2025-11-22: Remove abstract getDefaultSize from SymbolBase

## 概要

`SymbolBase` から抽象メソッド `getDefaultSize()` を削除し、API をよりシンプルにする変更を実装した。

## 目的

- `SymbolBase` の API から `getDefaultSize()` を除去
- サブクラス側で不要であれば実装を削除できるようにする
- より柔軟な設計にする

## 実装した変更

### 1. SymbolBase の変更
- `abstract getDefaultSize(): { width: number; height: number }` 宣言を削除
- 他の抽象メソッド (`toSVG()`, `getConnectionPoint()`) は維持

### 2. LayoutContext の変更
- `applyFixedSize(symbol, size)` メソッドの `size` パラメータを必須に変更
- 以前はデフォルトパラメータとして `symbol.getDefaultSize()` を使用していた
- 変更後は呼び出し元が明示的にサイズを指定する必要がある

### 3. 呼び出し元の更新

すべての `applyFixedSize()` 呼び出し箇所を更新:

**プラグイン:**
- `src/plugin/core/plugin.ts`: 5箇所 (circle, ellipse, rectangle, roundedRectangle, text)
- `src/plugin/uml/plugin.ts`: 2箇所 (actor, usecase)

**テスト:**
- `tests/layout_solver.test.ts`: 2箇所 (createActor, createUsecase)
- `tests/layout_constraints.test.ts`: 1箇所 (createActor)

すべての箇所で `layout.applyFixedSize(symbol)` を `layout.applyFixedSize(symbol, symbol.getDefaultSize())` に変更した。

## 影響範囲の分析

### 既存の実装への影響
- 各シンボル実装 (`CircleSymbol`, `ActorSymbol` など) は `getDefaultSize()` の実装を保持
- 抽象メソッドではなくなったため、サブクラスは自由に実装できる
- 既存の実装が残っているため、機能的な影響はなし

### 参照箇所
- `SystemBoundarySymbol` は独自の `getDefaultSize()` 実装を持ち、`applyMinSize()` 内で使用
- `TextSymbol` のテストで `getDefaultSize()` を直接呼び出しているが、実装は残っているため問題なし

## テスト結果

✅ **すべてのテスト通過**: 66 tests
✅ **ビルド成功**: TypeScript コンパイルエラーなし
✅ **タイプチェック成功**: 型定義も正しく生成
✅ **コードレビュー**: レビューコメントなし
✅ **セキュリティチェック**: CodeQL でアラートなし

## 変更統計

```
src/layout/layout_context.ts     |  2 +-
src/model/symbol_base.ts         |  2 --
src/plugin/core/plugin.ts        | 10 +++++-----
src/plugin/uml/plugin.ts         |  4 ++--
tests/layout_constraints.test.ts |  2 +-
tests/layout_solver.test.ts      |  4 ++--
6 files changed, 11 insertions(+), 13 deletions(-)
```

## 今後の検討事項

- 将来的にサイズが不要なシンボルを作成する場合、`getDefaultSize()` を実装しなくてもよい
- `applyFixedSize()` の呼び出し時にサイズを明示的に指定する必要があるが、これによりコードの意図がより明確になる
- 他のシンボル実装でも同様のパターンを適用できる可能性がある

## コミット

- Commit: `8d0037e` - "Remove abstract getDefaultSize from SymbolBase"
- Branch: `copilot/remove-getdefaultsize-method`
