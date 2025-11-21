import type { LayoutVar, LayoutVariables } from "./layout_variables"
import { Operator, type LayoutSolver } from "./kiwi"

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
    private readonly vars: LayoutVariables,
    private readonly solver: LayoutSolver,
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
      this._right = this.vars.createVar(`${this.x.name}.right`)
      this.solver.addConstraint(
        this._right,
        Operator.Eq,
        this.solver.expression([{ variable: this.x }, { variable: this.width }])
      )
    }
    return this._right
  }

  get bottom(): LayoutVar {
    if (!this._bottom) {
      this._bottom = this.vars.createVar(`${this.y.name}.bottom`)
      this.solver.addConstraint(
        this._bottom,
        Operator.Eq,
        this.solver.expression([{ variable: this.y }, { variable: this.height }])
      )
    }
    return this._bottom
  }

  get centerX(): LayoutVar {
    if (!this._centerX) {
      this._centerX = this.vars.createVar(`${this.x.name}.centerX`)
      this.solver.addConstraint(
        this._centerX,
        Operator.Eq,
        this.solver.expression([{ variable: this.x }, { variable: this.width, coefficient: 0.5 }])
      )
    }
    return this._centerX
  }

  get centerY(): LayoutVar {
    if (!this._centerY) {
      this._centerY = this.vars.createVar(`${this.y.name}.centerY`)
      this.solver.addConstraint(
        this._centerY,
        Operator.Eq,
        this.solver.expression([{ variable: this.y }, { variable: this.height, coefficient: 0.5 }])
      )
    }
    return this._centerY
  }
}
