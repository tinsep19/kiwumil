# kiwi モジュールへの境界の明確化

## 目的
- Layout 系のモジュール境界を明確にし、@lume/kiwi（以降 kiwi）に依存するロジックとレイアウトの高レベル API を分離する。
- solver の所有場所を統一してライフサイクルを管理しやすくする（LayoutContext に移動）。
- 可読性と再利用性を向上させ、将来的なテスト・差し替え（mock / alternate solver）の導入を容易にする。
- **各モジュールの責務を明確に分離し、LayoutSolver でできる範囲のことを各モジュールが独立して扱えるようにする。**

## 背景 / 問題意識
- 現状では kiwi.Solver が src/layout/layout_variables.ts に置かれており、solver のライフサイクルと solve の呼び出しタイミングが散らばっている。
- 変数定義（LayoutVariables）と制約管理（LayoutConstraints / LayoutContext）が solver の所有権を明確に共有できておらず、複数レイアウトやバッチ更新の運用時に管理が難しい。
- kiwi へ依存する変換ロジック（LayoutExpression -> kiwi.Expression）や solver 操作が複数箇所に分散しているため、変更時の影響範囲が広い。
- **LayoutVariables の責務が込み入っており、変数生成以外の機能（expression()、addConstraint()）も持っている。**
- **LayoutConstraints が LayoutVariables を経由して solver にアクセスしており、間接的な依存関係が責務を曖昧にしている。**

## 改善の方針
- kiwi 依存の変換ユーティリティとソルバーラッパーを src/layout/kiwi に集約する（toKiwiExpression、LayoutSolver 等）。
- LayoutContext が Solver（LayoutSolver）を所有し、solve（updateVariables）のトリガとバッチ管理を担う。
- **LayoutVariables を簡素化し、LayoutVar および LayoutBound の生成と値の取得のみに専念させる。**
- **expression() メソッドを LayoutSolver に移動し、kiwi ラッパーとしての責務を明確にする。**
- **LayoutConstraints が solver を直接受け取り、vars と solver を独立して使用できるようにする。**
- **vars と constraints の関係を切り離し、両者とも LayoutSolver を通じて連携する設計にする。**

## 移行手順（安全に進める順番）
1. ✅ kiwi ラッパーを作成（完了）
   - src/layout/kiwi/index.ts を追加し、toKiwiExpression と LayoutSolver（kiwi.Solver のラッパ）を実装する。
   - Operator / Strength の再エクスポートも行い、kiwi 依存を一箇所に集約する。

2. ✅ 型の切り出し（完了）
   - LayoutVar / LayoutExpression 等の型・ブランド・判定関数を src/layout/layout_types.ts にまとめる。
   - 循環依存を避けつつ、型のみを参照できる状態にする。

3. ✅ LayoutVariables を依存注入対応にする（完了）
   - LayoutVariables のコンストラクタを (solver?: LayoutSolver) に変更し、引数がなければ内部で新規作成する実装にする。
   - 既存コードは当面影響を受けない（デフォルト挙動で動作）。

4. ✅ LayoutContext に Solver を移動（完了）
   - LayoutContext が LayoutSolver を new して保持するように変更する。
   - Context が solver のライフサイクルを管理し、solve のタイミングを制御する。

5. ✅ LayoutConstraints の責務整理（評価完了）
   - 移行手順 1-4 により、基本的な責務分離は達成。

6. ✅ 呼び出し元の更新（評価完了）
   - solve() は既に Context 経由で実行される設計に移行済み。

7. **🔄 責務の最終調整（実施中）**
   - **LayoutSolver に expression() メソッドを追加**
   - **LayoutVariables から expression() と addConstraint() を削除し、変数生成のみに専念**
   - **LayoutConstraints のコンストラクタを (vars, solver, theme, resolveSymbol) に変更**
   - **LayoutConstraints が vars と solver を独立して使用する設計に変更**
   - **LayoutContext を vars, solver, constraints の統括役として明確化**

8. 副次作業と検証
   - tsc（型チェック）および既存テストを実行して動作確認。
   - solve の呼び出しタイミング（バッチ化）による動作やパフォーマンスの回帰がないか簡易ベンチを実施。
   - 変更点をドキュメント（README や開発者向けメモ）に追記。

## リスクと軽減策
- 循環インポート：型（layout_types）と kiwi ラッパーを分離することで回避する。
- 動作変更（solve のタイミング）：Context 側でバッチの制御を行うため、solve の呼び出し箇所が増える可能性がある。既存の solve 呼び出しを一箇所に集約するか、互換 API を残して段階的移行する。
- API の互換性：まずは LayoutVariables が内部で新規 LayoutSolver を作る既存挙動を残し、段階的に Context 注入へ切り替える。

## 実施予定の差分（概略）
- ✅ 追加: src/layout/kiwi/index.ts（toKiwiExpression、LayoutSolver）
- ✅ 追加: src/layout/layout_types.ts（型定義とブランドシンボル）
- 🔄 変更: src/layout/kiwi/index.ts（LayoutSolver に expression() メソッドを追加）
- 🔄 変更: src/layout/layout_variables.ts（expression() と addConstraint() を削除、変数生成のみに専念）
- 🔄 変更: src/layout/layout_constraints.ts（コンストラクタに solver を追加、vars と solver を独立して使用）
- 🔄 変更: src/layout/layout_context.ts（solver を constraints にも注入）

## 最終アーキテクチャ

```
LayoutContext (オーケストレーション)
  ├── solver: LayoutSolver（所有、ライフサイクル管理）
  ├── vars: LayoutVariables（solver 注入）
  └── constraints: LayoutConstraints（vars と solver を両方注入）

LayoutVariables（変数とバウンドの生成・管理）
  - createVar(): LayoutVar の生成
  - ensureLayoutBounds(): LayoutBound の生成
  - valueOf(): 変数値の取得
  ※ expression() と addConstraint() は削除

LayoutSolver（kiwi ラッパー）
  - expression(): 式の作成 ← LayoutVariables から移動
  - addConstraint(): 制約の追加
  - removeConstraint(): 制約の削除
  - updateVariables(): solve の実行
  - その他 kiwi の機能ラッパー

LayoutConstraints（制約生成ロジック）
  - コンストラクタ: (vars, solver, theme, resolveSymbol)
  - vars: 変数生成のみに使用
  - solver: 式作成と制約追加に使用
  - arrangeHorizontal() などの制約生成ロジック
```

**データフロー**:
- vars と constraints は独立（直接の依存なし）
- 両方とも solver を通じて連携
- Context が vars, solver, constraints を統括

## 完了状況
- ✅ 移行手順 1-7 完了
- ✅ すべてのテスト通過
- ✅ 後方互換性維持

最終アーキテクチャ
```
LayoutContext
  ├── solver: LayoutSolver（所有）
  ├── vars: LayoutVariables（solver 注入済み）
  └── constraints: LayoutConstraints（vars と solver を両方注入）

データフロー:
  - vars と constraints は独立
  - 両方とも solver を通じて連携
  - Context が全体を統括
```

次のアクション
- この PR では計画と実装が完了しました。
- docs/draft/kiwi-boundary-refactor.md は docs/design/ に移動可能です。
- さらなる最適化は別 PR で実施します。
