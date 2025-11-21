# 2025-11-21 kiwi ラッパーモジュールの作成（移行手順 1）

## 背景

[docs/draft/kiwi-boundary-refactor.md](../draft/kiwi-boundary-refactor.md) の移行手順 1 を実施。

現状の課題：
- kiwi.Solver が `src/layout/layout_variables.ts` に散在し、ライフサイクル管理が不明確
- kiwi への依存が複数箇所に分散しており、将来的なテスト・差し替えが困難
- 変換ロジック（`LayoutExpression` → `kiwi.Expression`）が `LayoutVariables` 内部の private メソッドとして隠蔽されている

## 実施した作業

### 1. kiwi ラッパーモジュールの作成

**追加ファイル**: `src/layout/kiwi/index.ts`

以下の機能を実装：

#### 型定義のエクスポート
- `LayoutVar`: ブランド付き kiwi.Variable 型
- `LayoutTerm`: レイアウト式の項（変数 + 係数）
- `LayoutExpression`: レイアウト式（項の配列 + 定数）
- `LayoutExpressionInput`: 式の入力型（式、変数、定数のいずれか）

#### Operator / Strength の再エクスポート
- `Operator`: 制約の演算子（Eq, Ge, Le）
- `Strength`: 制約の強度（Required, Strong, Weak）

kiwi の Operator と Strength を再エクスポートすることで、他のモジュールが直接 `@lume/kiwi` をインポートする必要がなくなった。

#### 型ガード関数
- `isLayoutVar(input)`: LayoutVar 型の判定
- `isLayoutExpression(input)`: LayoutExpression 型の判定

#### 変換ユーティリティ
- `toKiwiExpression(input)`: LayoutExpressionInput を kiwi.Expression に変換
- `createLayoutVar(name)`: ブランド付き LayoutVar を作成

これまで `LayoutVariables` 内部の private メソッドだった `toKiwiExpression` を public な関数として公開した。

#### LayoutSolver クラス
kiwi.Solver のラッパークラスとして実装。以下のメソッドを提供：
- `addConstraint(left, operator, right, strength)`: 制約を追加
- `removeConstraint(constraint)`: 制約を削除
- `addEditVariable(variable, strength)`: 変数の編集を開始
- `removeEditVariable(variable)`: 変数の編集を終了
- `suggestValue(variable, value)`: 変数に値を提案
- `updateVariables()`: ソルバーを実行し、すべての変数の値を更新
- `getInternalSolver()`: 内部の kiwi.Solver にアクセス（必要に応じて）

将来的に LayoutContext が LayoutSolver を所有する際の基盤となる。

### 2. layout_variables.ts の更新

**変更ファイル**: `src/layout/layout_variables.ts`

#### インポートの変更
```typescript
// 旧: import * as kiwi from "@lume/kiwi"
// 新: kiwi ラッパーから必要な型・関数をインポート
import {
  createLayoutVar,
  toKiwiExpression,
  Operator,
  Strength,
  type LayoutVar,
  type LayoutTerm,
  type LayoutExpression,
  type LayoutExpressionInput
} from "./kiwi"
```

#### 型定義の整理
- 型定義を kiwi モジュールから re-export
- `LayoutConstraintOperator` を `Operator` の alias として定義
- `LayoutConstraintStrength` を `Strength` の alias として定義

これにより既存のコードとの互換性を保ちつつ、kiwi モジュールへの依存を集約した。

#### createVar の実装変更
```typescript
// 旧: 内部で kiwi.Variable を直接作成しブランドを付与
// 新: createLayoutVar 関数を呼び出し
createVar(name: string): LayoutVar {
  return createLayoutVar(name)
}
```

#### addConstraint の実装変更
```typescript
// 旧: this.toKiwiExpression を使用
// 新: toKiwiExpression 関数を使用
addConstraint(...) {
  const leftExpr = toKiwiExpression(left)
  const rightExpr = toKiwiExpression(right)
  // ...
}
```

#### private メソッドの削除
- `toKiwiExpression` メソッドを削除（kiwi モジュールの関数を使用）
- `isLayoutVar`, `isLayoutExpression` ヘルパーも削除（kiwi モジュールに移動）

### 3. テストの実行

すべてのテストが成功することを確認：
```bash
$ bun test
 66 pass
 0 fail

$ bun run test:types
# 型テストも成功
```

## 効果

### 1. kiwi 依存の集約
- kiwi への依存が `src/layout/kiwi/index.ts` に集約された
- 他のモジュールは kiwi モジュールをインポートするだけで済む

### 2. テスト・差し替えの準備
- `LayoutSolver` クラスにより、将来的なモック実装が容易になった
- `toKiwiExpression` が public 関数となり、個別にテスト可能になった

### 3. 可読性の向上
- 型定義と変換ロジックが独立したモジュールとして整理された
- LayoutVariables の責務が明確になった（変数管理に専念）

### 4. 既存コードとの互換性維持
- LayoutVariables の public API は変更なし
- `LayoutConstraintOperator`, `LayoutConstraintStrength` も既存の名前で export

## 次のステップ

移行手順の次の段階：
1. ✅ kiwi ラッパーを作成（完了）
2. 型の切り出し（`src/layout/layout_types.ts` の作成）
3. LayoutVariables を依存注入対応にする
4. LayoutContext に Solver を移動
5. LayoutConstraints の責務整理

次は手順 2 または 3 を実施する予定。
