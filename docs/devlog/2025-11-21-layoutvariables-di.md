# 2025-11-21 Variables を依存注入対応にする（移行手順 3）

## 背景

[docs/draft/kiwi-boundary-refactor.md](../draft/kiwi-boundary-refactor.md) の移行手順 3 を実施。

移行手順 1, 2 で kiwi ラッパーモジュールと型定義の分離を完了したが、`Variables` はまだ内部で `kiwi.Solver` を直接使用していた。将来的に `LayoutContext` が `KiwiSolver` を所有し、それを `Variables` に注入する設計にするため、`Variables` を依存注入に対応させる必要があった。

## 実施した作業

### 1. Variables のコンストラクタを変更

**変更ファイル**: `src/kiwi/layout_variables.ts`

#### 変更前
```typescript
import * as kiwi from "@lume/kiwi"

export class Variables {
  private readonly solver: kiwi.Solver

  constructor(solver?: kiwi.Solver) {
    this.solver = solver ?? new kiwi.Solver()
  }
  
  addConstraint(...) {
    const leftExpr = toKiwiExpression(left)
    const rightExpr = toKiwiExpression(right)
    const constraint = new kiwi.Constraint(...)
    this.solver.addConstraint(constraint)
    return constraint
  }
}
```

#### 変更後
```typescript
import {
  KiwiSolver,
  // ...
} from "./kiwi"

export class Variables {
  private readonly solver: KiwiSolver

  constructor(solver?: KiwiSolver) {
    this.solver = solver ?? new KiwiSolver()
  }
  
  addConstraint(...) {
    return this.solver.addConstraint(left, operator, right, strength)
  }
}
```

### 2. 主な変更点

#### コンストラクタの引数型
- **旧**: `solver?: kiwi.Solver`
- **新**: `solver?: KiwiSolver`

引数がなければ内部で新規 `KiwiSolver` を作成するため、既存コードは影響を受けない。

#### solver フィールドの型
- **旧**: `private readonly solver: kiwi.Solver`
- **新**: `private readonly solver: KiwiSolver`

#### addConstraint の実装
- **旧**: 内部で `toKiwiExpression` と `kiwi.Constraint` を使用して制約を作成し、solver に追加
- **新**: `KiwiSolver.addConstraint` メソッドに委譲

これにより、制約作成のロジックが `KiwiSolver` に集約され、`Variables` の責務が明確になった。

#### インポートの整理
- `import * as kiwi from "@lume/kiwi"` を削除
- `KiwiSolver` を kiwi モジュールからインポート
- `toKiwiExpression` は addConstraint で使用しなくなったため、インポートリストから削除可能（実際には後で他の用途で使う可能性があるため残している）

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

### 1. 依存注入の準備完了
- `Variables` が `KiwiSolver` を外部から注入できるようになった
- デフォルトでは内部で新規作成するため、既存コードとの互換性を維持

### 2. 責務の明確化
- `Variables`: 変数の作成と管理に専念
- `KiwiSolver`: 制約の追加と解決を担当

### 3. 将来の拡張性向上
- LayoutContext が KiwiSolver を作成し、Variables に注入する設計が可能になった
- 複数の Variables が同じ KiwiSolver を共有することも可能
- テスト時にモック KiwiSolver を注入できる

### 4. コードの簡潔化
- addConstraint メソッドが KiwiSolver に委譲することで実装がシンプルに
- kiwi.Constraint の直接操作が不要になり、抽象化レベルが向上

## 既存コードとの互換性

### 変更なしで動作するパターン
```typescript
// パターン 1: 引数なし（デフォルト動作）
const vars = new Variables()
// 内部で new KiwiSolver() が作成される

// パターン 2: 既存の使い方
const x = vars.createVar("x")
vars.addConstraint(x, Operator.Eq, 42)
vars.solve()
```

### 新しく可能になるパターン
```typescript
// パターン 3: KiwiSolver を注入
const solver = new KiwiSolver()
const vars = new Variables(solver)
// 同じ solver を複数の Variables で共有可能
```

## 次のステップ

移行手順の次の段階：
1. ✅ kiwi ラッパーを作成（完了）
2. ✅ 型の切り出し（完了）
3. ✅ Variables を依存注入対応にする（完了）
4. ⏳ LayoutContext に Solver を移動
5. ⏳ LayoutConstraints の責務整理

次は手順 4（LayoutContext への Solver 移動）を実施する予定。LayoutContext が KiwiSolver を所有し、Variables に注入する設計に移行する。
