import type { Theme } from "../core/theme"
import type { SymbolBase } from "../model/symbol_base"
import type { SymbolId, ContainerSymbolId } from "../model/types"
import { LayoutVariables, type LayoutVar } from "./layout_variables"
import { LayoutConstraints } from "./layout_constraints"

export class LayoutContext {
  readonly vars: LayoutVariables
  readonly constraints: LayoutConstraints
  readonly theme: Theme

  constructor(
    theme: Theme,
    resolveSymbol: (id: SymbolId | ContainerSymbolId) => SymbolBase | undefined
  ) {
    this.theme = theme
    this.vars = new LayoutVariables()
    this.constraints = new LayoutConstraints(this.vars, theme, resolveSymbol)
  }

  solve() {
    this.vars.solve()
  }

  valueOf(variable: LayoutVar): number {
    return this.vars.valueOf(variable)
  }
}
