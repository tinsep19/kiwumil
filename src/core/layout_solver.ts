// src/core/layout_solver.ts
import type { VariableId, ILayoutVariable, LayoutConstraintId, ILayoutConstraint, ISuggestHandleFactory } from "./symbols"
import type { ConstraintSpec } from "./constraints_builder"

/**
 * ILayoutSolver: Layout solver interface
 */
export interface ILayoutSolver {
  /**
   * Create a layout variable
   */
  createLayoutVariable(id: VariableId): ILayoutVariable

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
