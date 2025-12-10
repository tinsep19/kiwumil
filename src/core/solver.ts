// src/core/solver.ts
// レイアウトソルバーのインターフェース

import type { VariableId, LayoutConstraintId } from "./types"
import type { ILayoutVariable, ISuggestHandleFactory } from "./layout_variable"
import type { ILayoutConstraint, ConstraintSpec } from "./constraint"

/**
 * ILayoutSolver: Layout solver interface
 */
export interface ILayoutSolver {
  /**
   * Create a layout variable
   */
  createVariable(id: VariableId): ILayoutVariable

  /**
   * Update variables
   */
  updateVariables(): void

  /**
   * Create a constraint with an ID using a callback pattern
   */
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): ILayoutConstraint

  /**
   * Create a fluent edit variable handle
   */
  createHandle(variable: ILayoutVariable): ISuggestHandleFactory
}
