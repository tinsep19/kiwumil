// src/model/symbol_base.ts
import type { SymbolId, Point, ISymbol } from "../core"
import type { Theme } from "../theme"
import type { LinearConstraintBuilder, LayoutBounds } from "../core"

export interface SymbolBaseOptions {
  id: SymbolId
  layout: LayoutBounds
  theme: Theme
}

export abstract class SymbolBase implements ISymbol {
  readonly id: SymbolId
  readonly layout: LayoutBounds
  protected readonly theme: Theme

  constructor(options: SymbolBaseOptions) {
    this.id = options.id
    this.layout = options.layout
    this.theme = options.theme
  }

  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
  abstract ensureLayoutBounds(builder: LinearConstraintBuilder): void

  /**
   * ISymbol interface implementation - delegates to toSVG()
   */
  render(): string {
    return this.toSVG()
  }
}
