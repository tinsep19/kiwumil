# 2025-11-21 LayoutVariables を依存注入対応にする（移行手順 3）

## 背景

[docs/draft/kiwi-boundary-refactor.md](../draft/kiwi-boundary-refactor.md) の移行手順 3 を実施。

移行手順 1, 2 で kiwi ラッパーモジュールと型定義の分離を完了したが、`LayoutVariables` はまだ内部で `kiwi.Solver` を直接使用していた。将来的に `LayoutContext` が `LayoutSolver` を所有し、それを `LayoutVariables` に注入する設計にするため、`LayoutVariables` を依存注入に対応させる必要があった。

## 実施した作業

### 1. LayoutVariables のコンストラクタを変更

**変更ファイル**: `src/layout/layout_variables.ts`

#### 変更前
```typescript
import * as kiwi from "@lume/kiwi"

export class LayoutVariables {
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
  LayoutSolver,
  // ...
} from "./kiwi"

export class LayoutVariables {
  private readonly solver: LayoutSolver

  constructor(solver?: LayoutSolver) {
    this.solver = solver ?? new LayoutSolver()
  }
  
  addConstraint(...) {
    return this.solver.addConstraint(left, operator, right, strength)
  }
}
```

### 2. 主な変更点

#### コンストラクタの引数型
- **旧**: `solver?: kiwi.Solver`
- **新**: `solver?: LayoutSolver`

引数がなければ内部で新規 `LayoutSolver` を作成するため、既存コードは影響を受けない。

#### solver フィールドの型
- **旧**: `private readonly solver: kiwi.Solver`
- **新**: `private readonly solver: LayoutSolver`

#### addConstraint の実装
- **旧**: 内部で `toKiwiExpression` と `kiwi.Constraint` を使用して制約を作成し、solver に追加
- **新**: `LayoutSolver.addConstraint` メソッドに委譲

これにより、制約作成のロジックが `LayoutSolver` に集約され、`LayoutVariables` の責務が明確になった。

#### インポートの整理
- `import * as kiwi from "@lume/kiwi"` を削除
- `LayoutSolver` を kiwi モジュールからインポート
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
- `LayoutVariables` が `LayoutSolver` を外部から注入できるようになった
- デフォルトでは内部で新規作成するため、既存コードとの互換性を維持

### 2. 責務の明確化
- `LayoutVariables`: 変数の作成と管理に専念
- `LayoutSolver`: 制約の追加と解決を担当

### 3. 将来の拡張性向上
- LayoutContext が LayoutSolver を作成し、LayoutVariables に注入する設計が可能になった
- 複数の LayoutVariables が同じ LayoutSolver を共有することも可能
- テスト時にモック LayoutSolver を注入できる

### 4. コードの簡潔化
- addConstraint メソッドが LayoutSolver に委譲することで実装がシンプルに
- kiwi.Constraint の直接操作が不要になり、抽象化レベルが向上

## 既存コードとの互換性

### 変更なしで動作するパターン
```typescript
// パターン 1: 引数なし（デフォルト動作）
const vars = new LayoutVariables()
// 内部で new LayoutSolver() が作成される

// パターン 2: 既存の使い方
const x = vars.createVar("x")
vars.addConstraint(x, Operator.Eq, 42)
vars.solve()
```

### 新しく可能になるパターン
```typescript
// パターン 3: LayoutSolver を注入
const solver = new LayoutSolver()
const vars = new LayoutVariables(solver)
// 同じ solver を複数の LayoutVariables で共有可能
```

## 次のステップ

移行手順の次の段階：
1. ✅ kiwi ラッパーを作成（完了）
2. ✅ 型の切り出し（完了）
3. ✅ LayoutVariables を依存注入対応にする（完了）
4. ⏳ LayoutContext に Solver を移動
5. ⏳ LayoutConstraints の責務整理

次は手順 4（LayoutContext への Solver 移動）を実施する予定。LayoutContext が LayoutSolver を所有し、LayoutVariables に注入する設計に移行する。
