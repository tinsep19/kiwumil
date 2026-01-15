import type { FreeVariable, LinearConstraint } from "./types"
import type { ConstraintSpec, ConstraintStrength, SuggestHandle } from "../../../core/solver"

/**
 * ICassowarySolver: 純粋な Cassowary 制約ソルバーのインターフェース
 * 
 * このインターフェースは id を知らず、純粋に数値制約の解決のみを行います。
 * id の管理は Domain 層（VariableFactory, ConstraintFactory）が担当します。
 */
export interface ICassowarySolver {
  /**
   * Create a free variable (without id)
   * @param name Optional debug name
   * @returns FreeVariable
   */
  createVariable(name?: string): FreeVariable

  /**
   * Create raw constraints from a spec
   * @param spec Constraint specification
   * @returns Array of LinearConstraint
   */
  createConstraint(spec: ConstraintSpec): LinearConstraint[]

  /**
   * Update all variables by solving constraints
   */
  updateVariables(): void

  /**
   * Create a suggest handle for editing variables
   * @param variable Target variable
   * @param strength Constraint strength for the edit variable
   * @returns SuggestHandle
   */
  createHandle(variable: FreeVariable, strength: ConstraintStrength): SuggestHandle
}
