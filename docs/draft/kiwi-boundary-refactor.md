# kiwi モジュールへの境界の明確化

## 目的
- Layout 系のモジュール境界を明確にし、@lume/kiwi（以降 kiwi）に依存するロジックとレイアウトの高レベル API を分離する。
- solver の所有場所を統一してライフサイクルを管理しやすくする（LayoutContext に移動）。
- 可読性と再利用性を向上させ、将来的なテスト・差し替え（mock / alternate solver）の導入を容易にする。

## 背景 / 問題意識
- 現状では kiwi.Solver が src/layout/layout_variables.ts に置かれており、solver のライフサイクルと solve の呼び出しタイミングが散らばっている。
- 変数定義（LayoutVariables）と制約管理（LayoutConstraints / LayoutContext）が solver の所有権を明確に共有できておらず、複数レイアウトやバッチ更新の運用時に管理が難しい。
- kiwi へ依存する変換ロジック（LayoutExpression -> kiwi.Expression）や solver 操作が複数箇所に分散しているため、変更時の影響範囲が広い。

## 改善の方針
- kiwi 依存の変換ユーティリティとソルバーラッパーを src/layout/kiwi に集約する（toKiwiExpression、LayoutSolver 等）。
- LayoutContext が Solver（LayoutSolver）を所有し、solve（updateVariables）のトリガとバッチ管理を担う。
- LayoutVariables は solver を注入可能にして（コンストラクタ引数）、最終的には Context から渡されるようにする。まずは互換性を保った段階的移行を行う。
- LayoutConstraints は制約オブジェクトの生成に専念させ、実際の solver への追加は Context 側で行う形に整理する。

## 移行手順（安全に進める順番）
1. kiwi ラッパーを作成
   - src/layout/kiwi/index.ts を追加し、toKiwiExpression と LayoutSolver（kiwi.Solver のラッパ）を実装する。
   - Operator / Strength の再エクスポートも行い、kiwi 依存を一箇所に集約する。

2. 型の切り出し（既に作業済/並行可）
   - LayoutVar / LayoutExpression 等の型・ブランド・判定関数を src/layout/layout_types.ts にまとめる。
   - 循環依存を避けつつ、型のみを参照できる状態にする。

3. LayoutVariables を依存注入対応にする（互換性確保フェーズ）
   - LayoutVariables のコンストラクタを (solver?: LayoutSolver) に変更し、引数がなければ内部で新規作成する実装にする。
   - 既存コードは当面影響を受けない（デフォルト挙動で動作）。

4. LayoutContext に Solver を移動
   - LayoutContext が LayoutSolver を new して保持するように変更する。
   - Context に addConstraint / addVariable / solve（または flush/batchSolve）等の API を追加し、Context がソルバーのオーケストレーションを行う。

5. LayoutConstraints の責務整理
   - Constraint を「生成して返す」役割に限定し、生成した Constraint を Context が受け取り solver に追加するフローに変更する。

6. 呼び出し元の更新（段階的に置換）
   - 既存の variables.addConstraint / variables.solve を context.addConstraint / context.solve に置き換えていく。
   - まずは変数・制約作成は従来どおり行い、追加先だけ Context に切り替えるとリスクが低い。

7. 副次作業と検証
   - tsc（型チェック）および既存テストを実行して動作確認。
   - solve の呼び出しタイミング（バッチ化）による動作やパフォーマンスの回帰がないか簡易ベンチを実施。
   - 変更点をドキュメント（README や開発者向けメモ）に追記。

## リスクと軽減策
- 循環インポート：型（layout_types）と kiwi ラッパーを分離することで回避する。
- 動作変更（solve のタイミング）：Context 側でバッチの制御を行うため、solve の呼び出し箇所が増える可能性がある。既存の solve 呼び出しを一箇所に集約するか、互換 API を残して段階的移行する。
- API の互換性：まずは LayoutVariables が内部で新規 LayoutSolver を作る既存挙動を残し、段階的に Context 注入へ切り替える。

## 実施予定の差分（概略）
- 追加: src/layout/kiwi/index.ts（toKiwiExpression、LayoutSolver）
- 変更: src/layout/layout_variables.ts（solver 注入対応、内部実装の参照先を kiwi ラッパへ）
- 変更: src/layout/layout_context.ts（LayoutSolver を保持し、addConstraint/solve を提供）
- 追加/変更: src/layout/layout_types.ts（既存の型/ブランドの切り出し／整理）
- 変更: src/layout/layout_constraints.ts（Constraint の生成に専念するよう修正。solver の追加は Context 側へ移行）

## 次のアクション
- この PR は新ブランチ refactor/move-solver-to-context を作成し、docs/draft/kiwi-boundary-refactor.md を追加して PR を開きます。段階的な実装は別コミット/PR で行います。
