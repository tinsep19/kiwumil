// src/model/symbol_base.ts
import type { SymbolId, Point } from "./types"
import type { Theme } from "../theme"
import type { Bounds } from "../layout/bounds"
import type { LayoutConstraintBuilder } from "../layout/layout_constraints"

export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  protected theme?: Theme
  nestLevel: number = 0
  containerId?: SymbolId
  protected readonly layoutBounds: Bounds

  constructor(id: SymbolId, label: string, layoutBounds: Bounds) {
    this.id = id
    this.label = label
    this.layoutBounds = layoutBounds
  }

  setTheme(theme: Theme) {
    this.theme = theme
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
