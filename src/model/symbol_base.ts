// src/model/symbol_base.ts
import type { SymbolId, Bounds, Point } from "./types"
import type { Theme } from "../theme"
import type { LayoutBound } from "../layout/layout_bound"
import type { LayoutConstraintBuilder } from "../layout/layout_constraints"

export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds
  protected theme?: Theme
  nestLevel: number = 0
  containerId?: SymbolId
  protected readonly layoutBounds: LayoutBound

  constructor(id: SymbolId, label: string, layoutBounds: LayoutBound) {
    this.id = id
    this.label = label
    this.layoutBounds = layoutBounds
  }

  setTheme(theme: Theme) {
    this.theme = theme
  }

  abstract toSVG(): string

  abstract getConnectionPoint(from: Point): Point

  getLayoutBounds(): LayoutBound {
    return this.layoutBounds
  }

  ensureLayoutBounds(builder?: LayoutConstraintBuilder): LayoutBound {
    if (!this.layoutBounds) {
      throw new Error(`Layout bounds not initialized for symbol ${this.id}`)
    }
    if (builder) {
      this.buildLayoutConstraints(builder)
    }
    return this.layoutBounds
  }

  protected buildLayoutConstraints(_builder: LayoutConstraintBuilder): void {
    // noop; サブクラスでオーバーライド
  }
}
