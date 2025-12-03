import type { Theme } from "../theme"
import type { SymbolBase } from "../model"
import { LayoutVariables, type LayoutVar } from "./layout_variables"
import { LayoutConstraints } from "./layout_constraints"
import { LayoutSolver, type LayoutConstraint } from "./layout_solver"
import type { ConstraintsBuilder } from "./constraints_builder"

export class LayoutContext {
  private readonly solver: LayoutSolver
  readonly variables: LayoutVariables
  readonly constraints: LayoutConstraints
  readonly theme: Theme

  constructor(theme: Theme) {
    this.theme = theme
    this.solver = new LayoutSolver()
    this.variables = new LayoutVariables(this.solver)
    this.constraints = new LayoutConstraints(this.solver, theme)
  }

  solve() {
    this.solver.updateVariables()
  }

  /**
   * Create a ConstraintsBuilder backed by the internal solver.
   * @deprecated Use createConstraint instead
   */
  createConstraintsBuilder(): ConstraintsBuilder {
    return this.solver.createConstraintsBuilder()
  }

  /**
   * Create a constraint with an ID using a callback pattern
   * @param id Constraint identifier
   * @param fn Builder callback function
   * @returns LayoutConstraint with id and rawConstraints
   */
  createConstraint(id: string, fn: (builder: ConstraintsBuilder) => void): LayoutConstraint {
    return this.solver.createConstraint(id, fn)
  }

  solveAndApply(_symbols: SymbolBase[]) {
    this.solve()
    // Symbols now use .layout directly in toSVG/getConnectionPoint
    // No longer need to populate the deprecated bounds property
  }

  valueOf(variable: LayoutVar): number {
    return this.variables.valueOf(variable)
  }
}
