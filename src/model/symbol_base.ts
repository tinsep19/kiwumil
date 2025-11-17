// src/model/symbol_base.ts
import type { SymbolId, Bounds, Point } from "./types"
import type { Theme } from "../core/theme"
import type { LayoutVar, LayoutVariableContext } from "../layout/layout_variable_context"

export interface LayoutBounds {
  x: LayoutVar
  y: LayoutVar
  width: LayoutVar
  height: LayoutVar
}

export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds
  protected theme?: Theme
  nestLevel: number = 0
  containerId?: SymbolId
  protected layoutBounds?: LayoutBounds
  protected layoutContext?: LayoutVariableContext

  constructor(id: SymbolId, label: string, layoutContext?: LayoutVariableContext) {
    this.id = id
    this.label = label
    if (layoutContext) {
      this.attachLayoutContext(layoutContext)
    }
  }

  setTheme(theme: Theme) {
    this.theme = theme
  }

  abstract getDefaultSize(): { width: number; height: number }

  abstract toSVG(): string

  abstract getConnectionPoint(from: Point): Point

  protected attachLayoutContext(ctx: LayoutVariableContext) {
    if (this.layoutBounds) {
      return
    }
    this.layoutContext = ctx
    this.layoutBounds = {
      x: ctx.createVar(`${this.id}.x`),
      y: ctx.createVar(`${this.id}.y`),
      width: ctx.createVar(`${this.id}.width`),
      height: ctx.createVar(`${this.id}.height`)
    }
  }

  getLayoutBounds(): LayoutBounds {
    if (!this.layoutBounds) {
      throw new Error(`Layout bounds not initialized for symbol ${this.id}`)
    }
    return this.layoutBounds
  }

  ensureLayoutBounds(ctx: LayoutVariableContext): LayoutBounds {
    if (!this.layoutBounds) {
      this.attachLayoutContext(ctx)
    }
    return this.layoutBounds
  }
}
