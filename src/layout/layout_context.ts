import type { Theme } from "../core/theme"
import type { SymbolBase, LayoutBounds } from "../model/symbol_base"
import type { SymbolId, ContainerSymbolId, Size } from "../model/types"
import { LayoutVariables, type LayoutVar, LayoutConstraintStrength } from "./layout_variables"
import { LayoutConstraints } from "./layout_constraints"

type BoundsAxis = keyof LayoutBounds

interface BoundsTerm {
  axis: BoundsAxis
  coefficient?: number
}

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

  expressionFromBounds(
    bounds: LayoutBounds,
    terms: BoundsTerm[],
    constant = 0
  ) {
    return this.constraints.expression(
      terms.map(term => ({
        variable: bounds[term.axis],
        coefficient: term.coefficient
      })),
      constant
    )
  }

  applyFixedSize(
    symbol: SymbolBase,
    size: Size = symbol.getDefaultSize()
  ) {
    const bounds = symbol.getLayoutBounds()
    this.constraints.withSymbol(symbol, "symbolBounds", builder => {
      builder.eq(bounds.width, size.width)
      builder.eq(bounds.height, size.height)
    })
  }

  applyMinSize(
    symbol: SymbolBase,
    size: Size,
    strength: LayoutConstraintStrength = LayoutConstraintStrength.Weak
  ) {
    const bounds = symbol.getLayoutBounds()
    this.constraints.withSymbol(symbol, "symbolBounds", builder => {
      builder.ge(bounds.width, size.width, strength)
      builder.ge(bounds.height, size.height, strength)
    })
  }

  anchorToOrigin(
    symbol: SymbolBase,
    strength: LayoutConstraintStrength = LayoutConstraintStrength.Strong
  ) {
    const bounds = symbol.getLayoutBounds()
    this.constraints.withSymbol(symbol, "symbolBounds", builder => {
      builder.eq(bounds.x, 0, strength)
      builder.eq(bounds.y, 0, strength)
    })
  }
}
