// src/model/layout_context.ts
import type { Theme } from "../theme"
import type { ISymbol } from "../core"
import type { Variable, LayoutConstraint, ConstraintSpec, CassowarySolver } from "../core"
import { LayoutVariables } from "./layout_variables"
import { Hints } from "./hints"

export class LayoutContext {
  private readonly solver: CassowarySolver
  readonly variables: LayoutVariables
  readonly hints: Hints
  readonly theme: Theme

  constructor(solver: CassowarySolver, theme: Theme) {
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

  solveAndApply(_symbols: ISymbol[]) {
    this.solve()
    // Symbols now use .bounds directly in toSVG/getConnectionPoint
    // No longer need to populate the deprecated bounds property
  }

  valueOf(variable: Variable): number {
    return this.variables.valueOf(variable)
  }
}
