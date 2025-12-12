# 2025-11-18 LayoutContext リワーク

## 背景
- 従来は `LayoutVariableContext` にヒント情報 (LayoutHint) を貯め、`KiwiSolver.solve()` 内でまとめて制約を追加していた。
- ガイド API 等は既にオンラインで制約を登録しており整合性が取れていなかった。

## 変更点
1. **レイアウト基盤の再構築**
   - `LayoutVariableContext` を `LayoutVariables` にリネームし、kiwi の薄いブリッジとして簡素化。
   - `LayoutConstraints` / `LayoutConstraint` を追加し、kiwumil の論理的制約 (`arrangeHorizontal`, `alignTop`, `enclose`, `setDefaultSize`, `setMinSize` など) を管理できるようにした。
   - `LayoutContext` を導入し、`LayoutVariables` と `LayoutConstraints` を束ねて Symbol / Hint / Guide から利用できるようにした。

2. **Symbol / Hint / Solver の更新**
   - `createSymbolFactory` / `createRelationshipFactory`／各 Symbol 実装を `LayoutContext` 注入に対応。シンボル生成時に `layout.constraints` で初期制約をオンライン適用。
   - `HintFactory` / `GuideBuilder` は `LayoutConstraints` を直接呼び出し、`LayoutHint[]` を廃止。`hint.enclose(container: ContainerSymbolId, childIds: SymbolId[])` で型レベルの安全性を確保。
   - `KiwiSolver` は `layoutContext.solve()` と値の書き戻しのみを担当するシンプルなクラスに置き換え。

3. **型・ID の整備**
   - `LayoutConstraintId` (`constraints/${serial}`) をブランド型として導入。
   - `ContainerSymbolId` も既存の命名規則 (`"${plugin}/${symbol}-${serial}"`) を保ちつつブランド型化し、`diagram_plugin` 型定義でコンテナ返却ファクトリから自動推論する方向へ準備。

4. **テスト / ドキュメント**
   - `tests/layout_solver.test.ts` を新フローに合わせて再実装（オンライン制約の挙動と `LayoutConstraint` の効果を検証）。
   - `tests/layout_variable_context.test.ts` を `layout_variables.test.ts` にリネーム。
   - 設計メモ `docs/draft/2025-11-18-layout-hint-online.md` を作成し、今後実装する詳細や残タスクを整理。
5. **型・DSL テスト整備**
   - UML の `systemBoundary` ファクトリとダイアグラム全体シンボルを `ContainerSymbolId` ブランド型で扱い、`hint.enclose` 呼び出しが型レベルでも安全になった。
   - `tsd/namespace-dsl.test-d.ts` でコンテナ ID 推論を検証し、DSL の IntelliSense を壊さないことを確認。
   - `tests/layout_constraints.test.ts` を追加し、`LayoutConstraints.list()` を使って Arrange/Enclose のロジック制約が正しく記録されることを単体テストで担保。
6. **ContainerSymbolBase / 制約ビルダー実装**
   - `ContainerSymbolBase` を追加し、`DiagramSymbol` / `SystemBoundarySymbol` が継承して inbounds（コンテンツ領域）を提供。`LayoutConstraints.enclose` は inbounds を基準に Required 制約を生成する。
   - `hint.arrange` / `align` / `enclose` は `SymbolId | ContainerSymbolId` を受け取り、コンテナ入れ子を許容。
   - `LayoutConstraints` に `withSymbol` ビルダー（`expression`/`eq`/`ge` 付き）を導入し、`constraints/${symbolId}/${counter}` 命名でメタデータを管理。既存の `setDefaultSize/setMinSize` を廃止し、シンボル生成時にビルダー経由でサイズ制約を登録。
   - `ContainerSymbolId` / `toContainerSymbolId` をパブリックエクスポートし、`tsd/namespace-dsl` で型テストを回せるようにした（`bun run test:types` 成功）。ブランド化は既存の `generateSymbolId` を通し、追加メソッドを増やさず後段で型変換する方針。
   - `src/kiwi/constraint_helpers.ts` を追加し、固定サイズ・最小サイズ・原点アンカー・Bounds expression のヘルパーを提供。Core/UML プラグインや `DiagramSymbol`/`SystemBoundarySymbol` がこれらを使って初期制約を登録するよう統一した。

## 残タスク / 検討事項
- ~~`LayoutConstraints` ビルダーを利用する共通ヘルパー整備~~: `constraint_helpers.ts` で固定/最小サイズ・アンカー等の API を提供済み（2025-11-18）。今後はガイド/リレーション向けヘルパー追加など拡張を検討。
- `ContainerSymbolBase` の子管理・入れ子ケースに対するテスト拡充（`registerChild` の効果やレンダリング時の inbounds 反映など）。
- `LayoutConstraint` を利用したテストユーティリティの拡充（現在は Arrange/Enclose のみカバー。ガイドとの連携や Required/Strong の優先順位も確認したい）。
- 実装完了後の design docs などの更新。
