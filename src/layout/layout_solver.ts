// src/layout/layout_solver.ts
import type { SymbolBase } from "../model/symbol_base"
import type { LayoutBounds } from "../model/symbol_base"
import { LayoutContext } from "./layout_context"

export class LayoutSolver {
  constructor(private readonly layout: LayoutContext) {}

  solve(symbols: SymbolBase[]) {
    this.layout.solve()

    for (const symbol of symbols) {
      const bounds = this.getBounds(symbol)
      symbol.bounds = {
        x: this.layout.valueOf(bounds.x),
        y: this.layout.valueOf(bounds.y),
        width: this.layout.valueOf(bounds.width),
        height: this.layout.valueOf(bounds.height)
      }
    }
  }

  private getBounds(symbol: SymbolBase): LayoutBounds {
    return symbol.getLayoutBounds()
  }
}
