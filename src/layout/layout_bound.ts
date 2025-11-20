import type {
  LayoutVar,
  LayoutVariables,
  LayoutConstraintOperator
} from "./layout_variables"
import { LayoutConstraintOperator as Operator } from "./layout_variables"

export class LayoutBound {
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
