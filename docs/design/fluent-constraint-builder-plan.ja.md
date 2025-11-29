# Fluent 制約ビルダー移行計画

## 目的
- `docs/draft/container_base.md` のような簡潔な構成で fluent-style の制約ビルダーを導入し、現在の `LayoutConstraintBuilder` 操作を型名の衝突なく置き換えつつ制約メタデータを維持するための要件と段取りを明確にします。

## 現行の制約まわりの状況
- `src/layout/layout_constraints.ts` では `LayoutConstraintBuilder`（`expr`/`eq`/`ge`）と `LayoutConstraints`（`arrangeHorizontal` や `encloseGrid` など）の両方をエクスポートし、制約のバッチ記録とヒント生成を担っています。
- `SymbolBase`（`src/model/symbol_base.ts`）と各シンボル（`src/model/diagram_symbol.ts`、`src/plugin/core/...`、`src/plugin/uml/...`）は `ensureLayoutBounds` でビルダーを受け取り、シンボル・コンテナごとの制約を登録します。
- `LayoutContext`（`src/layout/layout_context.ts`）は `LayoutVariables`/`LayoutSolver`/`LayoutConstraints` を注入し、`applyMinSize` や `registerContainerConstraints` など `withSymbol` を軸にした操作を提供しています。
- `docs/draft/symbol_constraints.md` や `docs/draft/refine_symbol_base.md` は現行ビルダー契約の設計書であり、新しい fluent ビルダーは同じ拡張ポイントを満たす必要があります。

## 型名の重複チェック
- `rg "LayoutConstraintBuilder" -n src` により型定義は 1 箇所（`layout_constraints.ts`）で宣言され、モデル/プラグイン/テストにインポートされているだけなので、新 fluent 実装はこの名前を踏襲するか、明確な移行パスを提供する必要があります。
- `ConstraintBuilder` クラスは `@src` 内には存在しないため、`docs/draft/new_constraint_builder.md` の名前を使っても実行時エクスポートと衝突しませんが、既存コンシューマの互換性を担保する必要があります。

## Fluent 制約ビルダーの仕様
- 参照: `docs/draft/new_constraint_builder.md` では `expr(...)` → `eq(...)`/`ge(...)`/`le(...)` → `eq0`/`ge0`/`le0` → `strong`/`medium`/`weak` という連鎖 API を提示し、`rawConstraints` も保持する `ConstraintBuilder` を想定しています。
- 新しい実装は次を満たす必要があります:
  * `LayoutConstraints` が持つ `LayoutSolver` を再利用して制約を追加。
  * `LayoutSolver.expression` と整合する `LayoutExpressionInput` を組み立てる。
  * `tests/symbol_base_layout.test.ts` のように `getRawConstraints()` を確認する既存テストがそのまま動作すること。
  * `builder.expr(...).eq(...).strong()` のように `this` を返すチェーン可能な API。
  * `LayoutConstraintStrength`（Required/Strong/Weak）を用いて強度を決定し、既存 `LayoutContext` ヘルパーとの整合性を保つ。

## 移行ロードマップ
1. **fluent ビルダー本体の導入**
   - `src/layout/fluent_constraint_builder.ts`（または `layout_constraints.ts` 内）に fluent API を実装し、`LayoutSolver` と `LayoutExpressionInput` を利用。
   - `LayoutConstraintBuilder` の名前を維持するか、エイリアス付きで新しい型を公開し、既存の `SymbolBase` シグネチャを壊さない。
   - 受け入れ条件: `expr`/`eq`/`ge`/`le`/`eq0`/`ge0`/`le0`/`strong`/`medium`/`weak`/`getRawConstraints()` を持ち、単体テストから直接インスタンス化可能であること。
2. **`LayoutConstraints` / `LayoutContext` との橋渡し**
   - `withSymbol` で fluent ビルダーを生成し、シンボルコールバックを実行後に生まれた `rawConstraints` を現行と同じように記録。
   - `LayoutConstraintType` や `LayoutConstraintId` を変更せず、`arrange*`/`enclose*` からのメタデータを維持。
   - 受け入れ条件: `applyMinSize` / `anchorToOrigin` にある制約が以前と同じセットおよび強度で追加されること。
3. **モデル・プラグインの呼び出し元を移行**
   - `SymbolBase` とその派生クラス（`src/model/diagram_symbol.ts`、`src/plugin/core/symbols/*`、`src/plugin/uml/symbols/*`）内の `ensureLayoutBounds` を fluent API に合わせて整理。
   - `tests/symbol_base_layout.test.ts` を更新し、チェーンしたビルダー操作と制約収集が継続していることを確認。
   - 受け入れ条件: コンパイルエラーなし、制約の個数・強度がこれまで通りであること。
4. **ドキュメント化と検証**
   - `docs/design/fluent-constraint-builder-plan.md` / `.ja.md` などで fluent ビルダーの概要を記述し、`docs/draft/container_base.md` のように簡潔な型スニペットを添える。
   - fluent メソッドや zero shortcut を検証する単体テストを追加し、強度最終命令が `LayoutSolver` に正しく伝播することを確認。
   - 受け入れ条件: `npm test`/`bun test` が通り、新テストがビルダー API をカバー。

## 検証とテスト
- `tests/symbol_base_layout.test.ts` を fluent API に合わせて更新し、`rawConstraints` の長さや chain 呼び出し結果をチェック。
- 既存テストスイート（`tests/grid_figure_builder.test.ts` など `LayoutConstraints` に依存するものを含む）を実行し、制約記録が乱れないことを確認。
- TypeScript 型チェック（`tsc --noEmit`）を通し、新しいビルダー名や型エイリアスが衝突していないことを検証。

## リスク・補足
- `src/model/diagram_symbol.ts` が `LayoutConstraintType.containerInbounds` を使ってコンテナ制約を判別しているので、記録処理を変えると依存コードを壊す恐れがあります。
- エクスポート名を変更する場合は `LayoutConstraintBuilder` のエイリアスを用意し、ユーザーコードが突然破綻しない移行経路を用意すること。
- 本計画では `docs/draft/new_constraint_builder.md` を仕様の根拠としていますが、実装前にステークホルダーの合意を得ることを推奨します。
