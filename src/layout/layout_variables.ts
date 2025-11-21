// src/layout/layout_variables.ts
import * as kiwi from "@lume/kiwi"
import {
  createLayoutVar,
  toKiwiExpression,
  Operator,
  Strength,
  type LayoutVar,
  type LayoutTerm,
  type LayoutExpression,
  type LayoutExpressionInput
} from "./kiwi"

// 互換性のため既存の export を維持
export type { LayoutVar, LayoutTerm, LayoutExpression, LayoutExpressionInput }

export const LayoutConstraintOperator = Operator
export type LayoutConstraintOperator = Operator

export const LayoutConstraintStrength = Strength
export type LayoutConstraintStrength = Strength

export class LayoutVariables {
  private readonly solver: kiwi.Solver

  constructor(solver?: kiwi.Solver) {
    this.solver = solver ?? new kiwi.Solver()
  }

  createVar(name: string): LayoutVar {
    return createLayoutVar(name)
  }

  expression(terms: LayoutTerm[] = [], constant = 0): LayoutExpression {
    return { terms, constant }
  }

  addConstraint(
    left: LayoutExpressionInput,
    operator: LayoutConstraintOperator,
    right: LayoutExpressionInput,
    strength?: LayoutConstraintStrength
  ) {
    const leftExpr = toKiwiExpression(left)
    const rightExpr = toKiwiExpression(right)
    const constraint = new kiwi.Constraint(
      leftExpr,
      operator,
      rightExpr,
      strength
    )
    this.solver.addConstraint(constraint)
    return constraint
  }

  solve() {
    this.solver.updateVariables()
  }

  valueOf(variable: LayoutVar): number {
    return variable.value()
  }

}
