// src/model/symbol_base.ts
import type { SymbolId, Bounds, Point } from "./types"
import type { Theme } from "../core/theme"
import type { LayoutVariables } from "../layout/layout_variables"
import { LayoutBound } from "../layout/layout_bound"

export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds
  protected theme?: Theme
  nestLevel: number = 0
  containerId?: SymbolId
  protected layoutBounds?: LayoutBound
  protected layoutContext?: LayoutVariables

  constructor(id: SymbolId, label: string, layoutContext?: LayoutVariables) {
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

  protected attachLayoutContext(ctx: LayoutVariables | any) {
    if (this.layoutBounds) {
      return
    }
    this.layoutContext = ctx
    
    // LayoutContext か LayoutVariables かを判定
    const isContext = 'vars' in ctx && 'getSolver' in ctx
    const vars = isContext ? ctx.vars : ctx
    const solver = isContext ? ctx.getSolver() : vars.getSolver()
    
    if (!solver) {
      throw new Error("LayoutVariables without solver is no longer supported. Use LayoutContext or LayoutVariables with solver.")
    }
    
    this.layoutBounds = new LayoutBound(
      vars,
      solver,
      vars.createVar(`${this.id}.x`),
      vars.createVar(`${this.id}.y`),
      vars.createVar(`${this.id}.width`),
      vars.createVar(`${this.id}.height`)
    )
  }

  getLayoutBounds(): LayoutBound {
    if (!this.layoutBounds) {
      throw new Error(`Layout bounds not initialized for symbol ${this.id}`)
    }
    return this.layoutBounds!
  }

  ensureLayoutBounds(ctx: LayoutVariables | any): LayoutBound {
    if (!this.layoutBounds) {
      this.attachLayoutContext(ctx)
    }
    return this.layoutBounds!
  }

  applyLayoutBounds() {
    if (!this.layoutBounds) {
      throw new Error(`Layout bounds not initialized for symbol ${this.id}`)
    }
    this.bounds = {
      x: this.layoutBounds.x.value(),
      y: this.layoutBounds.y.value(),
      width: this.layoutBounds.width.value(),
      height: this.layoutBounds.height.value()
    }
  }
}
