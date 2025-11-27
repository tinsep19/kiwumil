// src/model/symbol_base.ts
import type { SymbolId, Point } from "./types"
import type { Theme } from "../theme"
import type { Bounds } from "../layout/bounds"
import type { LayoutConstraintBuilder } from "../layout/layout_constraints"

export interface SymbolBaseOptions {
  id: SymbolId
  layoutBounds: Bounds
  theme: Theme
}

export abstract class SymbolBase {
  readonly id: SymbolId
  protected readonly theme: Theme
  nestLevel: number = 0
  protected readonly layoutBounds: Bounds

  constructor(options: SymbolBaseOptions) {
    this.id = options.id
    this.layoutBounds = options.layoutBounds
    this.theme = options.theme
  }

  abstract toSVG(): string

  abstract getConnectionPoint(from: Point): Point

  getLayoutBounds(): Bounds {
    return this.layoutBounds
  }

  ensureLayoutBounds(builder?: LayoutConstraintBuilder): Bounds {
    if (builder) {
      this.buildLayoutConstraints(builder)
    }
    return this.layoutBounds
  }

  protected buildLayoutConstraints(_builder: LayoutConstraintBuilder): void {
    // noop; サブクラスでオーバーライド
  }
}
