import type { Theme } from "../theme"
import type { SymbolBase } from "../model/symbol_base"
import type { LayoutBound } from "./layout_bound"
import type { SymbolId, ContainerSymbolId } from "../model/types"
import { LayoutVariables, type LayoutVar } from "./layout_variables"
import { LayoutConstraints, LayoutConstraintStrength } from "./layout_constraints"
import { LayoutSolver } from "./kiwi"

type BoundsAxis = Exclude<keyof LayoutBound, "type">

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
    // Symbols now use getLayoutBounds() directly in toSVG/getConnectionPoint
    // No longer need to populate the deprecated bounds property
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

  expressionFromBounds(bounds: LayoutBound, terms: BoundsTerm[], constant = 0) {
    return this.constraints.expression(
      terms.map((term) => ({
        variable: bounds[term.axis],
        coefficient: term.coefficient,
      })),
      constant
    )
  }

  applyMinSize(
    symbol: SymbolBase,
    size: { width: number; height: number },
    strength: LayoutConstraintStrength = LayoutConstraintStrength.Weak
  ) {
    const bounds = symbol.getLayoutBounds()
    this.constraints.withSymbol(symbol, "symbolBounds", (builder) => {
      builder.ge(bounds.width, size.width, strength)
      builder.ge(bounds.height, size.height, strength)
    })
  }

  anchorToOrigin(
    symbol: SymbolBase,
    strength: LayoutConstraintStrength = LayoutConstraintStrength.Strong
  ) {
    const bounds = symbol.getLayoutBounds()
    this.constraints.withSymbol(symbol, "symbolBounds", (builder) => {
      builder.eq(bounds.x, 0, strength)
      builder.eq(bounds.y, 0, strength)
    })
  }
}
