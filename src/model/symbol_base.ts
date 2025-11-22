// src/model/symbol_base.ts
import type { SymbolId, Bounds, Point } from "./types"
import type { Theme } from "../theme"
import type { LayoutVariables } from "../layout/layout_variables"
import type { LayoutContext } from "../layout/layout_context"
import { LayoutBound } from "../layout/layout_bound"

export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds
  protected theme?: Theme
  nestLevel: number = 0
  containerId?: SymbolId
  protected layoutBounds?: LayoutBound
  protected layoutContext?: LayoutVariables | LayoutContext

  constructor(id: SymbolId, label: string, layoutContext?: LayoutVariables | LayoutContext) {
    this.id = id
    this.label = label
    if (layoutContext) {
      this.attachLayoutContext(layoutContext)
    }
  }

  setTheme(theme: Theme) {
    this.theme = theme
  }

  abstract toSVG(): string

  abstract getConnectionPoint(from: Point): Point

  protected attachLayoutContext(ctx: LayoutVariables | any) {
    if (this.layoutBounds) {
      return
    }
    this.layoutContext = ctx
    
    // LayoutContext か LayoutVariables かを判定
    const isContext = 'variables' in ctx && 'getSolver' in ctx
    const vars = isContext ? ctx.variables : ctx
    
    // createBound を使用して LayoutBound を生成
    this.layoutBounds = vars.createBound(this.id)
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

  protected isLayoutContext(ctx: LayoutVariables | LayoutContext): ctx is LayoutContext {
    return 'constraints' in ctx
  }

  protected applyFixedSize(size: { width: number; height: number }) {
    if (!this.layoutContext) {
      throw new Error(`Layout context not initialized for symbol ${this.id}`)
    }
    
    if (!this.isLayoutContext(this.layoutContext)) {
      throw new Error(`Cannot apply fixed size without full LayoutContext for symbol ${this.id}`)
    }
    
    const bounds = this.getLayoutBounds()
    this.layoutContext.constraints.withSymbol(this, "symbolBounds", builder => {
      builder.eq(bounds.width, size.width)
      builder.eq(bounds.height, size.height)
    })
  }
}
