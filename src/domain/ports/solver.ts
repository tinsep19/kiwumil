// src/domain/ports/solver.ts
// Cassowary ソルバーの抽象化インターフェース

import type { FreeVariable } from "../value/constraint/free_variable"
import type { Constraint } from "../value/constraint/constraint"
import type { ConstraintStrength } from "../value/constraint/constraint_strength"

/**
 * LinearConstraint: 線形制約のインターフェース
 * - 登録状態の確認
 * - 満足度の評価（tolerance を使用）
 * - 制約の削除
 */
export interface LinearConstraint {
  readonly strength: ConstraintStrength
  isSatisfied(): boolean
  isRegistered(): boolean
}

export class DefaultLinearConstraint<T> implements LinearConstraint {
  private registered: boolean = true

  constructor(
    readonly constraint: Constraint,
    readonly rawConstraint: T
  ) {}

  get strength() {
    return this.constraint.strength
  }
  isRegistered() {
    return this.registered
  }

  // ConstraintRegistrar.remove(ct: LinearConstraint) の内部で
  // rawConstraintを登録解除した後、無効化したことを通知する
  dispose() {
    this.registered = false
  }

  isSatisfied() {
    const lhs = this.constraint.lhs.reduce(
      (sum, [a, x]) => sum + a * (typeof x == "number" ? x : x.value()),
      0
    )
    const rhs = this.constraint.rhs.reduce(
      (sum, [a, x]) => sum + a * (typeof x == "number" ? x : x.value()),
      0
    )

    const absTol = 1e-6
    const relTol = 1e-9
    const scale = Math.max(1, Math.abs(lhs), Math.abs(rhs))
    const tol = absTol + relTol * scale

    const op = this.constraint.op
    switch (op) {
      case "eq":
        return Math.abs(lhs - rhs) <= tol
      case "le":
        return lhs <= rhs + tol
      case "ge":
        return lhs + tol >= rhs
      default:
        throw new Error(`${op} is not ConstraintOperation`)
    }
  }
}

/**
 * SuggestHandle: レイアウト変数への値の提案を行うハンドル
 */
export interface SuggestHandle {
  suggest(value: number): void
  strength(): ConstraintStrength
  variable(): FreeVariable
  dispose(): void
}

/**
 * CassowarySolver: Cassowary アルゴリズムのソルバー抽象化
 * Infrastructure 層で実装される
 */
export interface CassowarySolver {
  /**
   * レイアウト変数を作成
   */
  createVariable(name?: string): FreeVariable

  /**
   * 変数の値を更新
   */
  updateVariables(): void

  /**
   * 制約を作成して登録
   */
  createConstraint(expr: Constraint): LinearConstraint

  /**
   * 制約の登録を解除
   */
  removeConstraint(constraint: LinearConstraint): void

  createHandle(variable: FreeVariable, strength: ConstraintStrength): SuggestHandle
}
