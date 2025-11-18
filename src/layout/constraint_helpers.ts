import type { LayoutContext } from "./layout_context"
import type { SymbolBase, LayoutBounds } from "../model/symbol_base"
import type { Size } from "../model/types"
import { LayoutConstraintStrength } from "./layout_variables"

type BoundsAxis = keyof LayoutBounds

interface BoundsTerm {
  axis: BoundsAxis
  coefficient?: number
}

export function expressionFromBounds(
  layout: LayoutContext,
  bounds: LayoutBounds,
  terms: BoundsTerm[],
  constant = 0
) {
  return layout.constraints.expression(
    terms.map(term => ({
      variable: bounds[term.axis],
      coefficient: term.coefficient
    })),
    constant
  )
}

export function applyFixedSize(
  layout: LayoutContext,
  symbol: SymbolBase,
  size: Size = symbol.getDefaultSize()
) {
  const bounds = symbol.getLayoutBounds()
  layout.constraints.withSymbol(symbol, "symbolBounds", builder => {
    builder.eq(bounds.width, size.width)
    builder.eq(bounds.height, size.height)
  })
}

export function applyMinSize(
  layout: LayoutContext,
  symbol: SymbolBase,
  size: Size,
  strength: LayoutConstraintStrength = LayoutConstraintStrength.Weak
) {
  const bounds = symbol.getLayoutBounds()
  layout.constraints.withSymbol(symbol, "symbolBounds", builder => {
    builder.ge(bounds.width, size.width, strength)
    builder.ge(bounds.height, size.height, strength)
  })
}

export function anchorToOrigin(
  layout: LayoutContext,
  symbol: SymbolBase,
  strength: LayoutConstraintStrength = LayoutConstraintStrength.Strong
) {
  const bounds = symbol.getLayoutBounds()
  layout.constraints.withSymbol(symbol, "symbolBounds", builder => {
    builder.eq(bounds.x, 0, strength)
    builder.eq(bounds.y, 0, strength)
  })
}
