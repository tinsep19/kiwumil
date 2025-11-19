// src/model/symbol_base.ts
import type { SymbolId, Bounds, Point } from "./types"
import type { Theme } from "../core/theme"
import type {
  LayoutVar,
  LayoutVariables,
  LayoutConstraintOperator
} from "../layout/layout_variables"
import { LayoutConstraintOperator as Operator } from "../layout/layout_variables"

export class LayoutBounds {
  readonly x: LayoutVar
  readonly y: LayoutVar
  readonly width: LayoutVar
  readonly height: LayoutVar

  private _right?: LayoutVar
  private _bottom?: LayoutVar
  private _centerX?: LayoutVar
  private _centerY?: LayoutVar

  constructor(
    private readonly ctx: LayoutVariables,
    x: LayoutVar,
    y: LayoutVar,
    width: LayoutVar,
    height: LayoutVar
  ) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  get right(): LayoutVar {
    if (!this._right) {
      this._right = this.ctx.createVar(`${this.x.name}.right`)
      this.ctx.addConstraint(
        this._right,
        Operator.Eq,
        this.ctx.expression([{ variable: this.x }, { variable: this.width }])
      )
    }
    return this._right
  }

  get bottom(): LayoutVar {
    if (!this._bottom) {
      this._bottom = this.ctx.createVar(`${this.y.name}.bottom`)
      this.ctx.addConstraint(
        this._bottom,
        Operator.Eq,
        this.ctx.expression([{ variable: this.y }, { variable: this.height }])
      )
    }
    return this._bottom
  }

  get centerX(): LayoutVar {
    if (!this._centerX) {
      this._centerX = this.ctx.createVar(`${this.x.name}.centerX`)
      this.ctx.addConstraint(
        this._centerX,
        Operator.Eq,
        this.ctx.expression([{ variable: this.x }, { variable: this.width, coefficient: 0.5 }])
      )
    }
    return this._centerX
  }

  get centerY(): LayoutVar {
    if (!this._centerY) {
      this._centerY = this.ctx.createVar(`${this.y.name}.centerY`)
      this.ctx.addConstraint(
        this._centerY,
        Operator.Eq,
        this.ctx.expression([{ variable: this.y }, { variable: this.height, coefficient: 0.5 }])
      )
    }
    return this._centerY
  }
}

export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds
  protected theme?: Theme
  nestLevel: number = 0
  containerId?: SymbolId
  protected layoutBounds?: LayoutBounds
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

  protected attachLayoutContext(ctx: LayoutVariables) {
    if (this.layoutBounds) {
      return
    }
    this.layoutContext = ctx
    this.layoutBounds = new LayoutBounds(
      ctx,
      ctx.createVar(`${this.id}.x`),
      ctx.createVar(`${this.id}.y`),
      ctx.createVar(`${this.id}.width`),
      ctx.createVar(`${this.id}.height`)
    )
  }

  getLayoutBounds(): LayoutBounds {
    if (!this.layoutBounds) {
      throw new Error(`Layout bounds not initialized for symbol ${this.id}`)
    }
    return this.layoutBounds!
  }

  ensureLayoutBounds(ctx: LayoutVariables): LayoutBounds {
    if (!this.layoutBounds) {
      this.attachLayoutContext(ctx)
    }
    return this.layoutBounds!
  }
}
