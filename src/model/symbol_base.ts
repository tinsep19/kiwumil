// src/model/symbol_base.ts
import type { SymbolId, Point } from "./types"
import type { Theme } from "../theme"
import type { ConstraintsBuilder, LayoutBounds } from "../layout"

export interface SymbolBaseOptions {
  id: SymbolId
  layout: LayoutBounds
  theme: Theme
}

export abstract class SymbolBase {
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
  abstract ensureLayoutBounds(builder: ConstraintsBuilder): void
}
