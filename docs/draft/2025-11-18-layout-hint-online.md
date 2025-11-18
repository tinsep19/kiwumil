# LayoutHint オンライン制約適用メモ

## 背景
- 現在は `HintFactory` が `LayoutHint[]` にメタ情報だけ貯め、`LayoutSolver.solve(symbols, hints)` 時にまとめて制約を張るバッチ処理。
- ガイド系 API はすでに `layoutContext.addConstraint` を即時実行しているため、アプローチの違いが生まれている。

## オンライン適用案
1.  **LayoutContext / LayoutVariables / LayoutConstraints の導入**
    - 既存の `LayoutVariableContext` を `LayoutVariables` にリネームし、kiwi の Variable/Constraint 生成だけを担う薄い層とする。
    - 新たに `LayoutConstraints`（kiwumil 側の制約を管理するクラス）を導入し、`LayoutConstraint` インスタンス（id, type, rawConstraints[]）を管理する。制約IDはブランド化した文字列で `constraints/${serial}` の形式を採用する。
    - `LayoutContext` は `LayoutVariables` と `LayoutConstraints` を束ねるコンテナで、シンボルやヒントは `LayoutVariableContext` の代わりにこの `LayoutContext` を受け取る。

2.  **Symbol/Relation ファクトリへの `LayoutContext` 注入**
    - `createSymbolFactory` / `createRelationshipFactory` には `LayoutVariableContext` ではなく `LayoutContext` を渡す。
    - Symbol/Relation は生成時に `LayoutContext` から `LayoutVariables` を使って Bound を確保し、同時に `LayoutConstraints` 経由で初期制約を登録する（通常シンボルは EQ/Strong、コンテナは Ge/Weak）。各シンボルが `LayoutContext.constraints` のヘルパーを直接呼び出す。

3.  **ヒント / ガイド API から直接制約を追加**
    - `HintFactory` や `GuideBuilder` は `LayoutContext.constraints.arrangeHorizontal(...)` のように直接呼び出し、`LayoutHint[]` に push しない。
    - 以後、「ヒントを呼ぶ = その場で `LayoutConstraint` が生成され、`constraints/${id}` というブランドIDで追跡できる」という流れに統一する。

4.  **テーマは LayoutContext の依存ではなく、Constraints/Renderer のみで使用**
    - `LayoutConstraints` は Theme (gap など) への参照を持ち、制約追加時に参照する。
    - シンボル本体は Theme を保持せず、描画時には `SvgRenderer` が Theme を参照してスタイルを決定する。`Symbol#setTheme` は不要になる。

5.  **enclose とコンテナ判定**
    - `ContainerSymbolId` は `SymbolId` と同じ命名規則（`"${plugin}/${symbol}-${serial}"`）で発行するブランド型。シンボル自身がコンテナかどうかを知っているため、外部では ID の型で判別する。
    - `hint.enclose` のシグネチャを `enclose(container: ContainerSymbolId, childIds: SymbolId[])` に変更し、呼び出し側が型レベルでコンテナを保証する。実行時には `LayoutConstraints` が Bound 情報に基づき Required 制約などを適用する。

6.  **テスト戦略の更新**
    - `LayoutConstraint` は kiwumil 側で定義する制約を表し、その配下に複数の `kiwi.Constraint` を保持する。テストでは `LayoutConstraints.list()` 等を通じて「どの kiwumil 制約がいくつの kiwi.Constraint を登録したか」を直接検証できる。

7.  **ドキュメント更新**
    - 実装完了後にまとめて `docs/design/layout-system.md` 等を更新する。本ドラフトを逐次更新し、最終段階でコードと突き合わせてレビュー・反映する。

## 残タスク / 検討事項
1. ~~**LayoutContext/Constraints API 仕上げ**~~: arrange/align/enclose が `SymbolId | ContainerSymbolId` を受け取れるよう更新済み（2025-11-18）。`enclose` は入れ子コンテナを許容。
2. ~~**制約ビルダー実装**~~: `LayoutConstraints.withSymbol()` と `constraints/${symbolId}/${counter}` 命名のビルダーを導入し、サイズ系制約を各シンボルが直接登録できるようにした（`setDefaultSize/setMinSize` を廃止、2025-11-18）。
3. ~~**ContainerSymbolId 対応の型システム**~~: UML の `systemBoundary` と DiagramSymbol を `ContainerSymbolId` として返却し、tsd テストで型推論を検証済み（2025-11-18）。
4. ~~**ContainerSymbolBase/inbounds 実装**~~: `ContainerSymbolBase` を追加し、Diagram/SystemBoundary が inbounds を公開。`HintFactory`/`LayoutConstraints.enclose` がコンテナ入れ子を扱えるようになった（2025-11-18）。
5. **LayoutConstraint を使ったテスト設計**: Arrange/Enclose は `tests/layout_constraints.test.ts` で検証できたが、ガイド連携・強度優先順位を含む追加テストを整備する。
6. **ドキュメント更新**: 実装完了後に design docs を更新する。
