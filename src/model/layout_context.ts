// src/model/layout_context.ts
import type { Theme } from "../theme"
import type { SymbolBase } from "./"
import type { LayoutVariable, LayoutConstraint, ConstraintSpec, ILayoutSolver } from "../core"
import { LayoutVariables } from "./layout_variables"
import { Hints } from "./hints"

export class LayoutContext {
  private readonly solver: ILayoutSolver
  readonly variables: LayoutVariables
  readonly hints: Hints
  readonly theme: Theme

  constructor(solver: ILayoutSolver, theme: Theme) {
    this.solver = solver
    this.theme = theme
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
   * @returns LayoutConstraint with id
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
