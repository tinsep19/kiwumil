// src/core/solver.ts
// レイアウトソルバーのインターフェース

import type { VariableId, LayoutConstraintId } from "./types"
import type { LayoutVariable, SuggestHandleFactory } from "./layout_variable"
import type { LayoutConstraint, ConstraintSpec } from "./constraint"

/**
 * ILayoutSolver: Layout solver interface
 */
export interface ILayoutSolver {
  /**
   * Create a layout variable
   */
  createVariable(id: VariableId): LayoutVariable

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
  createHandle(variable: LayoutVariable): SuggestHandleFactory
}
