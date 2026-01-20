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
  dispose(): void
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
   * 注: 実装は LayoutConstraint を返すが、内部的には複数の LinearConstraint を持つ
   */
  createConstraint(expr: Constraint): LinearConstraint

  /**
   * 制約の登録を解除
   */
  removeConstraint(constraint: LinearConstraint): void

  createHandle(variable: FreeVariable, strength: ConstraintStrength): SuggestHandle
}
