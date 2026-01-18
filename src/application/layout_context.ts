// src/application/layout_context.ts
import type { Theme } from "../theme"
import type { Variable, LayoutConstraint, ConstraintSpec, CassowarySolver } from "../core"
import { LayoutVariables } from "../model/layout_variables"
import { Hints } from "../model/hints"
import { SymbolRegistry } from "./symbol_registry"
import { RelationshipRegistry } from "./relationship_registry"
import { IconRegistry } from "../icon"

export class LayoutContext {
  private readonly solver: CassowarySolver
  readonly variables: LayoutVariables
  readonly hints: Hints
  readonly theme: Theme
  readonly symbols: SymbolRegistry
  readonly relationships: RelationshipRegistry
  readonly iconRegistry: IconRegistry

  constructor(solver: CassowarySolver, theme: Theme) {
    this.solver = solver
    this.theme = theme
    this.variables = new LayoutVariables(this.solver)
    this.hints = new Hints(this.solver, theme)
    this.symbols = new SymbolRegistry(this.variables)
    this.relationships = new RelationshipRegistry()
    this.iconRegistry = new IconRegistry()
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
