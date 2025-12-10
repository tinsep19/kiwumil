// src/model/symbol_base.ts
import type { SymbolId, Point, ISymbol } from "../core/symbols"
import type { Theme } from "../theme"
import type { IConstraintsBuilder, LayoutBounds } from "../layout"

export interface SymbolBaseOptions {
  id: SymbolId
  layout: LayoutBounds
  theme: Theme
}

export abstract class SymbolBase implements ISymbol {
  readonly id: SymbolId
  readonly layout: LayoutBounds
  protected readonly theme: Theme
  nestLevel: number = 0

  constructor(options: SymbolBaseOptions) {
    this.id = options.id
    this.layout = options.layout
    this.theme = options.theme
  }

  abstract toSVG(): string
  abstract getConnectionPoint(from: Point): Point
  abstract ensureLayoutBounds(builder: IConstraintsBuilder): void

  /**
   * ISymbol interface implementation - delegates to toSVG()
   */
  render(): string {
    return this.toSVG()
  }
}
