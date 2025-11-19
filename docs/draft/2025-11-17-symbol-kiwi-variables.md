# Symbol 内に kiwi.Variable を移す案の検討

**ステータス:** 📋 長期検討中（実装の90%以上は完了済み）  
**関連:** feat/layout-context-rework で大部分を実装済み  
**次のステップ:** Phase 3（Relationship対応など）は別PRで実施予定

## 実装状況

このドラフトで提案されていた内容の**90%以上は既に実装済み**です：

- ✅ LayoutVar ブランド型
- ✅ LayoutVariables（旧: LayoutVariableContext）
- ✅ Symbol内のLayoutBounds
- ✅ LayoutContext ファサード
- ✅ Guide API
- ✅ Symbol生成時の制約適用
- ✅ 派生変数（right/bottom/centerX/centerY）

詳細は `docs/draft/2025-11-19-symbol-kiwi-variables-status.md` を参照。

残作業は主にRelationshipのガイド対応など長期的な改善項目です。

---

# 元の提案内容

## 背景
- 現状は `LayoutSolver` が各 Symbol ごとに `kiwi.Variable` を管理し、`Map<SymbolId, NodeVar>` で保持している。
- 追加したいレイアウト機能として `createGuideX(x)` / `createGuideY(y)` のような「ガイド線」を想定しており、ヒント API から特定のガイドに対して `Symbol A` は `alignBottom`、`Symbol B` は `alignTop` などを直接制約に落としたい。
- Relationship も将来的にはガイドに沿って描画する（例えば特定の Y ガイドに平行な線に寄せる）ユースケースを考えている。
- このとき Symbol 側で `kiwi.Variable` を直接扱えれば、外部 API からガイドとシンボル変数を結びつけやすくなる。また、コンテナのように現在でも特殊な処理をしているものについては、Symbol 内から `width >= 60` などの制約を宣言できると記述量を減らせそう。

## 前提（検討更新）
- Symbol 自体は solver インスタンスへの直接参照を持たず、`LayoutVariableContext`（仮称）のような「変数と制約を登録するための窓口」オブジェクトを受け取ってやり取りする。
- この `LayoutVariableContext` への参照を Symbol が保持し、必要なタイミングで変数生成や制約追加を呼び出す。Symbol 内の intrinsic 制約も同じコンテキスト経由で solver に登録する。
- フローとしては「Symbol 生成時に LayoutVariableContext をコンストラクタへ渡し、そこで変数を生成→solver への登録まで行う」想定。ElementFactory / RelationshipFactory がこのコンテキストを受け取り、Symbol/Relationship 生成時に渡す。
- `symbol.bounds` の内部表現を `{ x: Variable; y: Variable; width: Variable; height: Variable }` に置き換え、計算後に数値へ変換する。
- ガイド API は `hint.createGuideY(symbol.bounds.y + symbol.bounds.height)` あるいは `symbol.bottom` のような補助変数を経由して `kiwi` 制約を設定する想定。

## メリット
1. **ガイドとの統合が容易**  
   - Symbol が `x`, `y`, `width`, `height` の変数を公開すれば、ヒント API やガイド生成ロジックが直接それらを参照して制約を貼れる。
   - `createGuideX` が返すオブジェクトに `kiwi.Variable` を保持し、Symbol の `x`/`y` と同等に扱えれば、配置や Relationship の制御がシンプルになる。
2. **Symbol 固有の制約を自己完結できる**  
   - コンテナ等の最小サイズ・特別な条件を Symbol 自身が `addConstraints` 的なメソッドで宣言できる。
   - 将来的に特殊な図形（例えば正三角形やテキストボックス）のレイアウト制限を追加しやすくなる。
3. **レイアウト責務の明確化**  
   - `LayoutSolver` はグローバルな制約管理に集中し、Symbol クラスは自身の intrinsic 制約やガイド連携に必要な補助変数（`bottom`, `centerX` など）を定義する役割になる。

## デメリット / 懸念
1. **Symbol が `kiwi.Variable` に依存する**  
   - solver 参照自体は `LayoutVariableContext` を介して隠蔽できるが、`symbol.bounds` の中身を `Variable` に変えるため `@lume/kiwi` の型を `SymbolBase` が直接参照することになる（レンダリング専用設計とのトレードオフ）。
2. **状態同期が複雑になる**  
   - 変数を `symbol.bounds` に直接保持する場合、solver 計算後に数値を抜き出すラッパーや `evaluateBounds()` が必要。ただし現状でも `bounds` は solve 後にしか参照していないため、実際の影響は小さい見込み。
3. **メモリ/パフォーマンスの懸念**  
   - Symbol 数が多い場合、各インスタンスに `LayoutVariableContext` 参照や `Variable` を持たせることで GC 圧が高まる可能性はあるが、solver API が Hint 内部にしか表出しないためユーザー影響は限定的。
4. **テスト影響**  
   - Symbol の単体テストで `LayoutVariableContext` のフェイクを用意する必要があるが、ヒント/DSL API から kiwi を直接触るわけではないため利用者側のテストは影響しない。

## 変更点の洗い出し
1. **SymbolBase へのフィールド追加**  
   - `bounds` を `VariableBounds`（`{ x: Variable; y: Variable; width: Variable; height: Variable }`）に差し替える。
   - `LayoutVariableContext` を介して変数生成と制約登録ができるように `symbol.initializeLayout(ctx)` のようなフックを追加。
2. **LayoutSolver の責務変更**  
   - 現在は `NodeVar` を `Map` に保持しているが、Symbol が変数を持つ場合は `LayoutSolver` から `Symbol.getVariables()` を参照する形に変更する。
   - `solver.addConstraint` を貼るメソッドは従来通り `LayoutSolver` 側で提供しつつ、Symbol 自体が追加制約を要求できる API（例: `symbol.applyIntrinsicConstraints(solver)`) を導入する。
3. **ヒント/ガイド API の導入準備**  
   - `HintFactory` に `createGuideX(value?: number)` などを追加し、返却するオブジェクトが `kiwi.Variable` を持つ構造を設計する。
   - Symbol で `bottom`, `right`, `centerX`, `centerY` など補助変数を作り、`hint.alignBottom(symbol, guide)` といった DSL を定義しやすくする。
4. **コンテナ/特殊シンボル用の最小サイズ指定**  
   - SymbolBase に `getIntrinsicConstraints()` のような抽象メソッドを設け、コンテナ系が `height >= 60` 等を定義。
   - LayoutSolver 側は Symbol からの constraint 定義を solver に渡す責務を持つ。
5. **影響範囲のテスト修正**  
   - 既存の `LayoutSolver` テストで `SymbolBase` のモックを置き換え、変数生成のフローを更新。
   - `TextSymbol` など新しいシンボルでも `Variable` が初期化されるか確認する追加テストが必要。
6. **パフォーマンス・メモリ検討**  
   - 変数生成タイミングを遅延させる（必要なときのみ）など工夫が必要かを検証。
   - `symbol.bounds` を `Variable` に変えることで描画フェーズが solver に依存しないよう、各レンダリング前に数値をキャッシュする仕組みが必要。

現時点では Relationship は `kiwi.Variable` を持たず、solve 後に確定した座標を使って線を描画する方針。

## 今後の進め方（案）
1. 小さな PoC として `TextSymbol` など一部の Symbol に `kiwi.Variable` を持たせ、LayoutSolver を最小限改造して挙動を確認。
2. ガイド API の DSL 仕様を `docs/design/layout-system.md` などで明文化。
3. 影響範囲が確定したら `symbol_base.ts` / `layout_solver.ts` / `hint_factory.ts` のリファクタリング計画を策定。

---

# 設計方針（ブランド型 + LayoutVariableContext）

## 1. ブランド型によるラップ
- `LayoutVar`（`type LayoutVar = kiwi.Variable & { __brand: "LayoutVar" }`）を定義し、Symbol / Hint / Guide の API ではこの型だけを公開する。
- `LayoutVariableContext` が `createVar(name: string): LayoutVar` を提供し、内部で `new kiwi.Variable(name)` を生成してブランド付けする。今後 `kiwi` 以外へ差し替えたい場合もこの層で吸収可能。
- `symbol.bounds` は `{ x: LayoutVar; y: LayoutVar; width: LayoutVar; height: LayoutVar }` へ置き換え、`bottom`, `centerX` なども同様に `LayoutVar` で表す。

## 2. LayoutVariableContext API
- 役割: Symbol から solver に依存せずに「変数生成」「制約追加」を依頼できる窓口。
- メソッド案:
  - `createVar(name: string): LayoutVar`
  - `addConstraint(expression: LayoutExpr, operator: Operator, rhs: LayoutExpr, strength?: Strength)`
  - `addEquation(varA: LayoutVar, varB: LayoutVar, gap?: number)`
  - 最終的に `LayoutSolver` が `ctx.flushToSolver()` 的に実際の `kiwi.Solver` へ渡す、もしくは Context が solver を内部保持して即時反映する（外部 API はあくまで `LayoutVar` を返すため `kiwi` は隠蔽）。

## 3. Symbol / Relationship フロー
1. `DiagramBuilder` が `LayoutVariableContext` を生成し、`NamespaceBuilder` から ElementFactory / RelationshipFactory へ渡す。
2. Symbol/Relationship のコンストラクタは `ctx` とラベルなどを受け取り、即座に `bounds`（あるいは線の制御点）の `LayoutVar` を作成。
3. Symbol 内部で最低限の制約を `ctx` 経由で貼る（例: `width >= minWidth`）。
4. LayoutSolver は `symbol.bounds` の `LayoutVar` を使って従来の arranged/align constraints を追加する。ヒント API も `symbol.bottom` や `guide.variable` を参照して制約を作成。
5. solver 解後に `ctx.evaluate(symbol.bounds.x)` のような API（`LayoutVar` → 数値）で `bounds` の実数値を得て renderer に渡す。

## 4. Hint / Guide 設計
- `createGuideX(name?: string)` は `LayoutVar` を内部に持つ `Guide` オブジェクトを返し、`guide.variable` でアクセスできるようにする。
- `guide.alignTop(symbol)` は `ctx.addConstraint(symbol.bounds.y == guide.variable)` などを実行。API 利用者は `kiwi` を意識せずに `guide` と `symbol` を指定するだけで制約を貼れる。
- `symbol.bottom` は `ctx.createDerivedVar(symbol.bounds.y, symbol.bounds.height)` のような形で派生変数を作っておき、`hint.createGuideY(symbol.bottom)` を簡潔に表現できるようにする。

## 5. 段階的実装ステップ
1. **基盤整備**: `LayoutVar` ブランド型、`LayoutVariableContext` インターフェース、`VariableBounds` 型を追加。
2. **SymbolBase リファクタ**: コンストラクタで `ctx` を受け取り、`bounds` を `LayoutVar` 化。`DiagramSymbol` や `TextSymbol` など主要シンボルで PoC 実装。
3. **LayoutSolver/Hint 更新**: 既存の `NodeVar` Map を廃止し、Symbol から `LayoutVar` を取得して constraint を組み立てる。ヒント API に `Guide` を追加。
4. **描画パイプライン更新**: renderer で `ctx.evaluateVar(layoutVar)` を呼び出し、`bounds` の数値版を生成。`SymbolBase` に `getBounds()` など数値取得メソッドを用意。
5. **段階移行**: すべての Symbol / Relationship に適用したら旧コードを削除し、`docs/design/layout-system.md` とテストを更新。
