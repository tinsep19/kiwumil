import type { Theme } from "../theme"
import type { SymbolBase } from "./"
import { LayoutVariables, type LayoutVariable, LayoutSolver, type LayoutConstraint, type ConstraintSpec } from "../layout"
import { Hints } from "../hint"

export class LayoutContext {
  private readonly solver: LayoutSolver
  readonly variables: LayoutVariables
  readonly hints: Hints
  readonly theme: Theme

  constructor(theme: Theme) {
    this.theme = theme
    this.solver = new LayoutSolver()
    this.variables = new LayoutVariables(this.solver)
    this.hints = new Hints(this.solver, theme)
  }

  solve() {
    this.solver.updateVariables()
  }

  /**
   * Create a constraint with an ID using a callback pattern
   * @param id Constraint identifier
   * @param spec Builder callback function
   * @returns LayoutConstraint with id and rawConstraints
   */
  createConstraint(id: string, spec: ConstraintSpec): LayoutConstraint {
    return this.solver.createConstraint(id, spec)
  }

  solveAndApply(_symbols: SymbolBase[]) {
    this.solve()
    // Symbols now use .layout directly in toSVG/getConnectionPoint
    // No longer need to populate the deprecated bounds property
  }

  valueOf(variable: LayoutVariable): number {
    return this.variables.valueOf(variable)
  }
}
