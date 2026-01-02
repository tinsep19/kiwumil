// src/model/layout_context.ts
import type { Theme } from "../theme"
import type { Variable, LayoutConstraint, ConstraintSpec, CassowarySolver } from "../core"
import { LayoutVariables } from "./layout_variables"
import { Hints } from "./hints"
import { SymbolRegistry } from "./symbols"
import { RelationshipRegistry } from "./relationships"

export class LayoutContext {
  private readonly solver: CassowarySolver
  readonly variables: LayoutVariables
  readonly hints: Hints
  readonly theme: Theme
  readonly symbols: SymbolRegistry
  readonly relationships: RelationshipRegistry

  constructor(solver: CassowarySolver, theme: Theme) {
    this.solver = solver
    this.theme = theme
    this.variables = new LayoutVariables(this.solver)
    this.hints = new Hints(this.solver, theme)
    this.symbols = new SymbolRegistry(this.variables)
    this.relationships = new RelationshipRegistry()
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

  valueOf(variable: Variable): number {
    return this.variables.valueOf(variable)
  }
}
