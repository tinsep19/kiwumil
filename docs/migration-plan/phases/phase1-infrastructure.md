# Phase 1: Infrastructure 層 - 詳細計画

**Phase**: 1 / 8  
**期間**: 2週間（Week 1-2）  
**見積もり**: 34時間  
**状態**: 未着手

---

## 🎯 目標

Phase 1 では、クリーンアーキテクチャの基盤となる Infrastructure 層を実装します。

### 主要目標

1. **Pure Cassowary Solver の実装**
   - Infrastructure 層として、ドメインロジックから独立した制約ソルバーを実装
   - `kiwi` への依存を隠蔽し、抽象的なインターフェースを公開

2. **`FreeVariable` インターフェースの定義**
   - ID を持たない純粋な変数インターフェース
   - `kiwi.Variable` との型互換性を確保

3. **型互換性の確認**
   - `kiwi.Variable` が `FreeVariable` を満たすことを型レベルで検証
   - 満たさない場合の軽量ラッパー実装も検討

---

## 📋 タスク分解

### Week 1: インターフェース定義（17時間）

#### タスク 1.1: `FreeVariable` インターフェースの定義

**ファイル**: `src/infra/solver/cassowary/types.ts`  
**見積もり**: 3時間

**内容:**

```typescript
/**
 * Pure variable interface without domain knowledge
 * This should be compatible with kiwi.Variable
 */
export interface FreeVariable {
  /**
   * Get the name of the variable
   */
  name(): string
  
  /**
   * Get the current value of the variable
   */
  value(): number
}

/**
 * Constraint strength
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

/**
 * Suggest handle for edit variables
 */
export interface SuggestHandle {
  /**
   * Suggest a value for the variable
   */
  suggest(value: number): void
  
  /**
   * Dispose the handle
   */
  dispose(): void
}
```

**成功基準:**

- インターフェースが明確に定義されている
- JSDoc コメントが充実している

---

#### タスク 1.2: `ICassowarySolver` インターフェースの定義

**ファイル**: `src/infra/solver/cassowary/cassowary-solver.interface.ts`  
**見積もり**: 4時間

**内容:**

```typescript
import type { FreeVariable, ConstraintStrength, SuggestHandle } from './types'

/**
 * Constraint specification
 */
export interface ConstraintSpec {
  expression: string | Expression
  operator: "eq" | "le" | "ge"
  strength?: ConstraintStrength
}

/**
 * Linear constraint (internal)
 */
export interface LinearConstraint {
  // Internal representation
}

/**
 * Pure Cassowary Solver Interface
 * This interface does not know about domain concepts like VariableId
 */
export interface ICassowarySolver {
  /**
   * Create a new variable
   * @param name Optional variable name for debugging
   */
  createVariable(name?: string): FreeVariable
  
  /**
   * Create constraints from specification
   * @param spec Constraint specification
   * @returns Array of linear constraints
   */
  createConstraint(spec: ConstraintSpec): LinearConstraint[]
  
  /**
   * Add a constraint to the solver
   */
  addConstraint(constraint: LinearConstraint): void
  
  /**
   * Remove a constraint from the solver
   */
  removeConstraint(constraint: LinearConstraint): void
  
  /**
   * Update all variables by solving constraints
   */
  updateVariables(): void
  
  /**
   * Create a suggest handle for edit variable
   * @param variable The variable to edit
   * @param strength The strength of the edit constraint
   */
  createHandle(variable: FreeVariable, strength: ConstraintStrength): SuggestHandle
}
```

**成功基準:**

- インターフェースが完全に定義されている
- メソッドの責務が明確
- 型安全性が確保されている

---

#### タスク 1.3: 型互換性チェックの実装

**ファイル**: `src/infra/solver/kiwi/type-check.ts`  
**見積もり**: 2時間

**内容:**

```typescript
import * as kiwi from '@lume/kiwi'
import type { FreeVariable } from '../cassowary/types'

/**
 * Type compatibility check: kiwi.Variable must satisfy FreeVariable
 * 
 * This is a compile-time check. If this file compiles without errors,
 * kiwi.Variable is compatible with FreeVariable.
 */

const _typeCheck: FreeVariable = new kiwi.Variable()

// If kiwi.Variable doesn't satisfy FreeVariable, we'll get a compile error here
// In that case, we need to implement a lightweight wrapper
```

**成功基準:**

- TypeScript がエラーなくコンパイルできる
- 型互換性が確認できている

---

#### タスク 1.4: 型互換性チェックのテスト

**ファイル**: `tests/infra/type-compatibility.test.ts`  
**見積もり**: 2時間

**内容:**

```typescript
import { describe, test, expect } from "bun:test"
import * as kiwi from '@lume/kiwi'
import type { FreeVariable } from '../../src/infra/solver/cassowary/types'

describe("Type Compatibility", () => {
  test("kiwi.Variable should satisfy FreeVariable interface", () => {
    const kiwiVar = new kiwi.Variable("test")
    
    // This should compile without type errors
    const freeVar: FreeVariable = kiwiVar
    
    // Check interface methods exist
    expect(typeof freeVar.name).toBe("function")
    expect(typeof freeVar.value).toBe("function")
    
    // Check method behavior
    expect(freeVar.name()).toBe("test")
    expect(typeof freeVar.value()).toBe("number")
  })
})
```

**成功基準:**

- テストが通る
- 型エラーがない

---

#### タスク 1.5: Week 1 のドキュメント化

**ファイル**: `phases/phase1-daily-log.md`  
**見積もり**: 6時間（各日1時間 × 6日）

**内容:**

- 日次での作業記録
- 完了タスクの記録
- 課題や学びの記録

---

### Week 2: KiwiSolver の実装（17時間）

#### タスク 2.1: `KiwiSolver` クラスの実装

**ファイル**: `src/infra/solver/kiwi/kiwi-solver.ts`  
**見積もり**: 5時間

**内容:**

```typescript
import * as kiwi from '@lume/kiwi'
import type { 
  ICassowarySolver, 
  FreeVariable, 
  ConstraintSpec,
  LinearConstraint,
  ConstraintStrength,
  SuggestHandle 
} from '../cassowary/cassowary-solver.interface'
import { KiwiSuggestHandle } from './suggest_handle'

export class KiwiSolver implements ICassowarySolver {
  private solver: kiwi.Solver
  
  constructor() {
    this.solver = new kiwi.Solver()
  }
  
  createVariable(name?: string): FreeVariable {
    return new kiwi.Variable(name)
  }
  
  createConstraint(spec: ConstraintSpec): LinearConstraint[] {
    // Implementation using ConstraintBuilder
  }
  
  addConstraint(constraint: LinearConstraint): void {
    this.solver.addConstraint(constraint as kiwi.Constraint)
  }
  
  removeConstraint(constraint: LinearConstraint): void {
    this.solver.removeConstraint(constraint as kiwi.Constraint)
  }
  
  updateVariables(): void {
    this.solver.updateVariables()
  }
  
  createHandle(variable: FreeVariable, strength: ConstraintStrength): SuggestHandle {
    return new KiwiSuggestHandle(this.solver, variable as kiwi.Variable, strength)
  }
}
```

**成功基準:**

- すべてのメソッドが実装されている
- kiwi への依存が適切に隠蔽されている

---

#### タスク 2.2: `KiwiSuggestHandle` クラスの実装

**ファイル**: `src/infra/solver/kiwi/suggest_handle.ts`  
**見積もり**: 3時間

**内容:**

```typescript
import * as kiwi from '@lume/kiwi'
import type { SuggestHandle, ConstraintStrength, FreeVariable } from '../cassowary/types'

export class KiwiSuggestHandle implements SuggestHandle {
  private solver: kiwi.Solver
  private variable: kiwi.Variable
  private editConstraint: kiwi.Constraint
  
  constructor(solver: kiwi.Solver, variable: FreeVariable, strength: ConstraintStrength) {
    this.solver = solver
    this.variable = variable as kiwi.Variable
    
    // Convert strength string to kiwi strength
    const kiwiStrength = this.convertStrength(strength)
    
    // Create edit constraint
    this.editConstraint = new kiwi.Constraint(
      this.variable,
      kiwi.Operator.Eq,
      0,
      kiwiStrength
    )
    
    this.solver.addEditVariable(this.variable, kiwiStrength)
  }
  
  suggest(value: number): void {
    this.solver.suggestValue(this.variable, value)
  }
  
  dispose(): void {
    this.solver.removeEditVariable(this.variable)
  }
  
  private convertStrength(strength: ConstraintStrength): number {
    switch (strength) {
      case "required": return kiwi.Strength.required
      case "strong": return kiwi.Strength.strong
      case "medium": return kiwi.Strength.medium
      case "weak": return kiwi.Strength.weak
    }
  }
}
```

**成功基準:**

- Suggest/Dispose が正しく動作する
- 強度の変換が正しい

---

#### タスク 2.3: `ConstraintBuilder` の更新

**ファイル**: `src/infra/solver/kiwi/constraint_builder.ts`  
**見積もり**: 3時間

**内容:**

- `ConstraintSpec` から `kiwi.Constraint` への変換
- 既存の constraint builder ロジックの統合

**成功基準:**

- 制約の生成が正しく動作する
- Expression のパースが正しい

---

#### タスク 2.4: KiwiSolver のテスト実装

**ファイル**: `tests/infra/kiwi-solver.test.ts`  
**見積もり**: 4時間

**内容:**

```typescript
import { describe, test, expect } from "bun:test"
import { KiwiSolver } from '../../src/infra/solver/kiwi/kiwi-solver'

describe("KiwiSolver", () => {
  test("should create variables", () => {
    const solver = new KiwiSolver()
    const v1 = solver.createVariable("x")
    const v2 = solver.createVariable("y")
    
    expect(v1.name()).toBe("x")
    expect(v2.name()).toBe("y")
  })
  
  test("should solve simple constraints", () => {
    const solver = new KiwiSolver()
    const x = solver.createVariable("x")
    const y = solver.createVariable("y")
    
    // x = 10
    const c1 = solver.createConstraint({
      expression: `${x.name()} == 10`,
      operator: "eq",
      strength: "required"
    })
    
    // y = x + 5
    const c2 = solver.createConstraint({
      expression: `${y.name()} == ${x.name()} + 5`,
      operator: "eq",
      strength: "required"
    })
    
    c1.forEach(c => solver.addConstraint(c))
    c2.forEach(c => solver.addConstraint(c))
    
    solver.updateVariables()
    
    expect(x.value()).toBe(10)
    expect(y.value()).toBe(15)
  })
  
  test("should handle suggest handles", () => {
    const solver = new KiwiSolver()
    const x = solver.createVariable("x")
    
    const handle = solver.createHandle(x, "strong")
    handle.suggest(100)
    solver.updateVariables()
    
    expect(x.value()).toBe(100)
    
    handle.dispose()
  })
})
```

**成功基準:**

- すべてのテストが通る
- カバレッジ 90% 以上

---

#### タスク 2.5: Week 2 のドキュメント化

**ファイル**: `phases/phase1-daily-log.md`  
**見積もり**: 2時間

**内容:**

- Week 2 の作業記録
- Phase 1 完了の確認
- 学んだことのまとめ

---

## 🎲 リスク評価

### リスク 1: `kiwi.Variable` が `FreeVariable` を満たさない

**影響度**: High  
**発生確率**: Medium（30%）

**対策:**

- タスク 1.3 で早期に型互換性をチェック
- 満たさない場合は軽量ラッパーを実装（追加3時間）
- ラッパーのパフォーマンスへの影響を最小化

**トリガー:**

- TypeScript コンパイルエラー
- 型テストの失敗

---

### リスク 2: 既存の ConstraintBuilder との統合問題

**影響度**: Medium  
**発生確率**: Low（20%）

**対策:**

- 既存コードを詳細にレビュー
- 段階的な統合（既存コードを残しつつ新実装を追加）
- 十分なテストカバレッジ

**トリガー:**

- テスト失敗
- 制約の解決が不正確

---

### リスク 3: SuggestHandle の実装の複雑さ

**影響度**: Low  
**発生確率**: Low（15%）

**対策:**

- kiwi の edit variable API を事前に調査
- シンプルな実装を優先
- 複雑な機能は Phase 3 に延期

**トリガー:**

- API の理解不足
- テストの失敗

---

## ✅ 成功基準

### 技術的基準

- [ ] すべてのインターフェースが定義されている
- [ ] `kiwi.Variable` が `FreeVariable` を満たす（または軽量ラッパーが実装されている）
- [ ] `KiwiSolver` がすべてのメソッドを実装している
- [ ] `KiwiSuggestHandle` が正しく動作する
- [ ] テストカバレッジ 90% 以上
- [ ] すべてのテストが通過

### プロセス基準

- [ ] 日次ログが記録されている
- [ ] 課題と学びが文書化されている
- [ ] 次の Phase への引き継ぎ事項が明確

### ドキュメント基準

- [ ] インターフェースに適切な JSDoc コメントがある
- [ ] README に使用例が記載されている
- [ ] 型互換性チェックの結果が記録されている

---

## 📚 参考資料

- [kiwi.js Documentation](https://github.com/lume/kiwi)
- [Cassowary Algorithm](https://constraints.cs.washington.edu/cassowary/)
- Clean Architecture by Robert C. Martin

---

## 🔗 関連ドキュメント

- **[マスター計画書](../master-plan.md)**: 全体像
- **[STATUS](../STATUS.md)**: 進捗状況
- **[Phase 1 日次ログ](./phase1-daily-log.md)**: 作業記録

---

**作成日**: 2026-01-15  
**最終更新**: 2026-01-15
