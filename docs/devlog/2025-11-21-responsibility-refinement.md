# 2025-11-21: 責務の最終調整（移行手順 7）

## 概要
LayoutVariables, LayoutSolver, LayoutConstraints の責務をさらに明確化するためのリファクタリングを実施。

## 背景
移行手順 1-6 により基本的なアーキテクチャは確立されたが、LayoutVariables の責務が込み入っており、expression() や addConstraint() などのメソッドを持っていた。これらのメソッドは本来 kiwi のラッパーとして LayoutSolver が提供すべき機能である。

## 実施内容

### 1. LayoutSolver に expression() メソッドを追加
- `expression(terms, constant)` メソッドを LayoutSolver に移動
- kiwi ラッパーとしての責務を明確化

### 2. LayoutVariables の簡素化
- `expression()` と `addConstraint()` を削除
- 変数生成（createVar, valueOf）のみに専念
- solver への参照を保持（`getSolver()` アクセサを提供）
- LayoutContext から solver を注入される設計に変更

### 3. LayoutConstraints の更新
- コンストラクタを `(vars, solver, theme, resolveSymbol)` に変更
- vars と solver を独立して使用
- 変数作成は vars, 式作成と制約追加は solver を使用
- `LayoutConstraintBuilder` も同様に solver を受け取るよう変更

### 4. LayoutContext の調整
- vars に solver を注入するよう変更
- constraints にも vars と solver の両方を渡すよう変更
- `getSolver()` メソッドを追加（hint_factory などから使用）

### 5. LayoutBound の更新
- vars と solver の両方を受け取るよう変更
- 変数作成は vars, 式作成と制約追加は solver を使用
- computed properties（right, bottom, centerX, centerY）も同様に更新

### 6. その他の調整
- `hint_factory.ts`: `layout.variables.addConstraint` を `layout.getSolver().addConstraint` に変更
- `symbol_base.ts`: vars から solver を取得するロジックを追加
- `container_symbol_base.ts`: layout.getSolver() を使用するよう変更

### 7. 互換性の確保
- LayoutVariables に `LayoutConstraintOperator` と `LayoutConstraintStrength` を再エクスポート
- 既存のインポートが動作し続けるよう後方互換性を維持

## 最終アーキテクチャ

```
LayoutContext（オーケストレーション）
  ├── solver: LayoutSolver（所有、ライフサイクル管理）
  ├── vars: LayoutVariables（solver 注入済み）
  └── constraints: LayoutConstraints（vars と solver を両方注入）

LayoutVariables（変数とバウンドの生成・管理）
  - createVar(): LayoutVar の生成
  - valueOf(): 変数値の取得
  - getSolver(): 注入された solver へのアクセス

LayoutSolver（kiwi ラッパー）
  - expression(): 式の作成
  - addConstraint(): 制約の追加
  - removeConstraint(): 制約の削除
  - updateVariables(): solve の実行

LayoutConstraints（制約生成ロジック）
  - vars: 変数生成に使用
  - solver: 式作成と制約追加に使用
  - arrangeHorizontal() などの高レベル制約 API
```

## データフロー
- vars と constraints は独立（直接の依存なし）
- 両方とも solver を通じて連携
- Context が vars, solver, constraints を統括

## テスト結果
✅ すべてのユニットテスト (66 tests) が成功
✅ 型テストも成功
✅ 完全な後方互換性を維持

## 効果
1. **明確な責務分離**: 各モジュールが LayoutSolver でできる範囲のことに専念
2. **vars と constraints の独立性**: 直接の依存関係を排除
3. **kiwi 依存の一元化**: expression() が LayoutSolver に集約
4. **テスタビリティの向上**: solver のモック化が容易に
5. **保守性の向上**: 変更の影響範囲が明確

## 次のステップ
- 移行手順 8: 副次作業と検証（任意）
  - パフォーマンステスト
  - ドキュメント更新
  - さらなる最適化の検討
