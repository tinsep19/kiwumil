// src/model/symbol_base.ts
import type { SymbolId, Point, ISymbol, ContainerBounds } from "../core"
import type { Theme } from "../theme"
import type { LinearConstraintBuilder, LayoutBounds } from "../core"

export interface SymbolBaseOptions {
  id: SymbolId
  bounds: LayoutBounds
  theme: Theme
}

export interface ContainerSymbol extends SymbolBase {
  readonly container: ContainerBounds
}

export abstract class SymbolBase implements ISymbol {
  readonly id: SymbolId
  readonly bounds: LayoutBounds
  protected readonly theme: Theme

  constructor(options: SymbolBaseOptions) {
    this.id = options.id
    this.bounds = options.bounds
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
