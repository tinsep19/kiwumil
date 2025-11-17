# Layout ドキュメント差分メモ

1. `docs/design/layout-system.md:323-350` において DiagramSymbol を (0, 0) に固定し viewport も (0, 0) 起点になると説明しているが、`src/layout/layout_solver.ts:48-54` では現在も先頭シンボル（DiagramSymbol）が (50, 50) に固定されており記述が一致していない。
2. 同ファイルの最小サイズ制約説明 (`docs/design/layout-system.md:366-374`) では DiagramSymbol の最小幅/高さが 200x150 とされているが、実装 (`src/layout/layout_solver.ts:27-44`) ではコンテナ扱いのシンボルすべてに 100x100 の弱制約しか課していない。
3. viewport 算出処理の説明 (`docs/design/layout-system.md:455-475`) は DiagramSymbol の bounds をそのまま viewBox に用いるとしているが、実際の `SvgRenderer` (`src/render/svg_renderer.ts:58-81`) は全シンボルの最大 x/y を走査してキャンバスサイズと viewBox を決定している。
4. arrange 系の実装説明 (`docs/design/layout-system.md:503-600`) では `arrangeHorizontal` が Y 軸位置も揃え、`arrangeVertical` が X 軸位置も揃えるような制約を列挙しているが、現在のソルバー (`src/layout/layout_solver.ts:99-190`) は並び方向のギャップ制約だけで直交方向のそろえは入れていない。
5. LayoutHint 型定義の節 (`docs/design/layout-system.md:937-956`) に `alignWidth` / `alignHeight` / `alignSize` が含まれておらず、HintFactory 実装 (`src/dsl/hint_factory.ts:31-95`) との乖離がある。
6. プラグイン実装ガイド (`docs/design/plugin-system.md:127-139`) の `createRelationshipFactory` 例では `layout: LayoutVariableContext` 引数が抜けているが、インターフェース (`src/dsl/diagram_plugin.ts:31-44`) と NamespaceBuilder (`src/dsl/namespace_builder.ts:56-80`) は layout を渡す契約になっているため、カスタムプラグイン作成者が誤ったシグネチャで実装してしまう。
