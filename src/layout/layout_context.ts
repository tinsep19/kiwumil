import type { Theme } from "../theme"
import type { SymbolBase } from "../model/symbol_base"
import type { LayoutBound } from "./layout_bound"
import type { SymbolId, ContainerSymbolId, Size } from "../model/types"
import { LayoutVariables, type LayoutVar } from "./layout_variables"
import { LayoutConstraints, LayoutConstraintStrength } from "./layout_constraints"
import { LayoutSolver } from "./kiwi"

type BoundsAxis = keyof LayoutBound

interface BoundsTerm {
  axis: BoundsAxis
  coefficient?: number
}

export class LayoutContext {
  private readonly solver: LayoutSolver
  readonly variables: LayoutVariables
  readonly constraints: LayoutConstraints
  readonly theme: Theme

  constructor(
    theme: Theme,
    resolveSymbol: (id: SymbolId | ContainerSymbolId) => SymbolBase | undefined
  ) {
    this.theme = theme
    this.solver = new LayoutSolver()
    this.variables = new LayoutVariables(this.solver)
    this.constraints = new LayoutConstraints(this.variables, this.solver, theme, resolveSymbol)
  }

  solve() {
    this.solver.updateVariables()
  }

  solveAndApply(symbols: SymbolBase[]) {
    this.solve()

    for (const symbol of symbols) {
      symbol.applyLayoutBounds()
    }
  }

  valueOf(variable: LayoutVar): number {
    return this.variables.valueOf(variable)
  }

  /**
   * LayoutSolver へのアクセサ（制約追加や式作成のため）
   * @returns LayoutSolver
   */
  getSolver(): LayoutSolver {
    return this.solver
  }

  expressionFromBounds(
    bounds: LayoutBound,
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
