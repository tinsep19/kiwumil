[English](layout-constraints-fluent-migration.md) | 日本語

# レイアウト制約フルエントビルダー移行計画

## 背景

- `docs/draft/new_constraint_builder.md` に従って `ConstraintsBuilder` を導入済みですが、まだ `KiwiSolver.addConstraint`/`.expression` や旧来の型ラッパーを使って制約を追加している箇所が残っています。
- 旧 API を放置すると `KiwiSolver` の公開面が肥大化し、ヒントやテストのような下流コードが古い API と新しい API の両方を気にする必要が出てきます。
- そこで、残る箇所をビルダーへ移し替えたうえで、型・エクスポートの整理も含めた移行手順をドキュメント化して共有します。

## 目的

1. `src/kiwi` 以下にある制約構築ロジック（`LayoutConstraints`／ガイド／テストなど）をすべて `ConstraintsBuilder` 経由で発行する。
2. 旧来の Kiwi ラッパー型（`LayoutTerm`、`LayoutExpression`、`toKiwiExpression` など）と、不要になった solver API を削除する。
3. 移行の実施順・受け入れ条件・テスト手順を明文化し、複数段階のコミットで安全に進められるようにする。

## マイグレーション計画

### 1. `LayoutConstraints` ヘルパーのビルダー化を完了する

- **実施内容**：`arrange*`、`align*`、`enclose*` などのユーティリティが `KiwiSolver.expression`/`addConstraint` を呼ばず、`ConstraintsBuilder` を一貫して利用するように見直します。`expr(...).eq(...).strong()` といったフローを明示し、生成された `rawConstraints` を `record()` に渡す構造を維持します。
- **受け入れ条件**：すべてのヘルパーが `createConstraintsBuilder()` で builder を取得し、以前と同じ数の制約／同じ強度で `record()` を呼ぶことができる。

### 2. `LayoutContext`／ヒント層／テストを builder へ切り替える

- **実施内容**：
  1. `LayoutContext` に安全に builder を取り出せるアクセサ（例：`createConstraintsBuilder()`）を用意し、`getSolver()` を廃止する。
  2. `guide_builder` のすべての `align`/`follow` 系メソッドを `ConstraintsBuilder` で書き直し、強度ごとに `.strong()` などを `finalize` する。
  3. `tests/bounds_validation.test.ts` や `layout_variables.test.ts`、`constraints_builder.test.ts` を新 API に沿って更新し、`context.solve()` を使い `context.solver` などの private フィールドを参照しない。
- **受け入れ条件**：`KiwiSolver.addConstraint`/`.expression` を呼ぶコードが `constraints_builder.ts` 以外に存在しないこと、ガイド／テストから `LayoutContext.getSolver()` を経由して solver を直接操作しないこと。

### 3. レガシーなエクスポートと型を整理する

- **実施内容**：
  1. `LayoutTerm`/`LayoutExpression`/`toKiwiExpression` といった obsolete なエクスポートを削除し、新しい `LayoutConstraintStrength`/`LayoutConstraintOperator` は `layout_constraints.ts` に集中させる。
  2. `src/index.ts` も新しい出口に合わせて更新し、不要な re-export を排除する。
  3. `src/kiwi` 内部の `kiwi` インポートを見直し、未使用の型や関数を削除する。
- **受け入れ条件**：必要最低限の型・定数だけが `src/kiwi` から公開され、旧 API を仮置きするコードが残らない。

## テスト & 検証

- `bun test`
- `bun run lint`（既存の `@typescript-eslint/no-unused-vars` 警告も解消する）
- 必要に応じて `tsc --noEmit`（`test:types` スクリプトが実行しているため、そのままでも可）

## リスク & 備考

- `KiwiSolver` の旧ヘルパーを削るのは最終段階まで待ち、すべての制約コードがビルダー経由になっていることを確認してから行う。
- ビルダーは内部的に同じ `kiwi.Constraint` を吐き出すので、`rawConstraints` を見る既存のテスト/ヒントが壊れないよう、生成順序・強度は意識しておく。
