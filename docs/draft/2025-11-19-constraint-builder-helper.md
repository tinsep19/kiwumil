# Constraint Builder Helper Draft

## 背景
- `LayoutConstraints.withSymbol(symbol, type, builder => { ... })` を直接呼ぶと、同じボイラープレート（`builder.eq(bounds.width, width)` 等）をシンボル実装やプラグイン側で繰り返し書くことになる。
- `LayoutVariables.expression` もそのまま使うと記述量が増えやすく、`expression([{ variable: bounds.x }, ...], constant)` のようなパターンが散在している。
- `ContainerSymbolBase` や図形プラグインが、共通のサイズ制約/アンカー処理/最小サイズ処理を簡潔に再利用できるヘルパーが欲しい。

## 目的
1. シンボルごとの初期制約登録（幅/高さの固定・最小サイズ・原点アンカー等）を簡単に記述できる。
2. コンテナ向けの inbounds 制約や padding 計算を共通化し、派生クラスが必要な値だけ指定すれば済むようにする。
3. 既存の `withSymbol`/`expression` をラップし、`LayoutConstraint` メタ情報（ID/タイプ）を保持しつつコード量を減らす。

## 実装状況 (2025-11-18)
- `src/layout/constraint_helpers.ts` を追加し、`expressionFromBounds` / `applyFixedSize` / `applyMinSize` / `anchorToOrigin` を提供。
- Core/UML プラグイン、`DiagramSymbol`、`SystemBoundarySymbol`、およびテスト類がこれらのヘルパー経由で初期制約を登録するよう更新。
- 今後の検討事項として、ガイド/リレーション向けの追加ヘルパーやコンテナ内部での自動配置フックを検討する。

## 想定ヘルパー

### 1. Bounds ヘルパー
- `applyFixedSize(symbol, size)`:
  ```ts
  applyFixedSize(symbol: SymbolBase, { width, height }: Size) {
    layout.constraints.withSymbol(symbol, "symbolBounds", builder => {
      builder.eq(symbol.getLayoutBounds().width, width)
      builder.eq(symbol.getLayoutBounds().height, height)
    })
  }
  ```
- `applyMinSize(symbol, size, strength = LayoutConstraintStrength.Weak)`:
  ```ts
  applyMinSize(symbol, size, strength = LayoutConstraintStrength.Weak) {
    layout.constraints.withSymbol(symbol, "symbolBounds", builder => {
      builder.ge(symbolBounds.width, size.width, strength)
      builder.ge(symbolBounds.height, size.height, strength)
    })
  }
  ```
- `anchorToOrigin(symbol)` など、(x, y) を 0 に固定するヘルパー。

### 2. Expression Builder
- `expr(bounds, terms: Array<["x" | "width", coefficient?]>, constant = 0)` のように、`LayoutBounds` から式を構築するヘルパー。
  ```ts
  const expr = layout.constraints.expressionFromBounds(bounds, [
    ["x"],
    ["width", 0.5]
  ])
  ```

### 3. Container 専用
- `ContainerSymbolBase` に `protected applyInboundsConstraints(padding, header)` のようなメソッドを追加し、`builder.eq(content.x, expr(bounds, [["x"]], padding.left))` 等を隠蔽。
- `registerContentMinSize(width, height)` のような protected ヘルパーを追加し、コンテナ内部領域の最小サイズも統一的に設定。

### 4. 固定 ID タイプヘルパー
- `withFixedConstraint(symbol, type, cb)` のように `type` を `LayoutConstraintType` から選び、`builder.record()` を内部で実行するラッパーを `LayoutConstraints` 側に追加する案も検討。

## メリット
- プラグイン実装（Core/UML）の `createSymbolFactory` が短くなり、サイズ制約やアンカー処理の重複を減らせる。
- 今後シンボルタイプを追加する場合も、同じヘルパーを使い回すだけで初期制約の整合性を保てる。
- テスト（`tests/layout_constraints` 等）で `LayoutConstraint` の type/id を揃えて検証しやすい。

## 実装方針
1. `src/layout/constraint_helpers.ts` のようなファイルを作成し、`applyFixedSize`, `applyMinSize`, `anchorToOrigin` 等を定義（`LayoutContext` を引数に取る or `LayoutConstraints` をラップ）。
2. `ContainerSymbolBase` に protected ヘルパーを追加し、派生クラスが `getContainerPadding` などのスカラー情報だけ提供すれば良いようにする。
3. Core/UML プラグインをヘルパー経由に切り替えて重複を削減。
4. 必要に応じて `LayoutConstraints` 自体に `expressionFromBounds` などのユーティリティを追加。
