// src/core/solver.ts
// レイアウトソルバーのインターフェース

import type { VariableId, LayoutConstraintId } from "./types"
import type { Variable } from "./layout_variable"
import type { LayoutConstraint, ConstraintSpec } from "./constraint"

/**
 * ConstraintStrength: 制約の強度
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

/**
 * SuggestHandle: レイアウト変数への値の提案を行うハンドル
 */
export interface SuggestHandle {
  suggest(value: number): void
  strength(): ConstraintStrength
  dispose(): void
}

/**
 * SuggestHandleFactory: SuggestHandleを作成するファクトリインターフェース
 */
export interface SuggestHandleFactory {
  strong(): SuggestHandle
  medium(): SuggestHandle
  weak(): SuggestHandle
}

/**
 * ILayoutSolver: Layout solver interface
 */
export interface ILayoutSolver {
  /**
   * Create a layout variable
   */
  createVariable(id: VariableId): Variable

  /**
   * Update variables
   */
  updateVariables(): void

  /**
   * Create a constraint with an ID using a callback pattern
   */
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): LayoutConstraint

  /**
   * Create a fluent edit variable handle
   */
  createHandle(variable: Variable): SuggestHandleFactory
}
