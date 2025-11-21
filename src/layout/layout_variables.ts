// src/layout/layout_variables.ts
import {
  createLayoutVar,
  toKiwiExpression,
  Operator,
  Strength,
  LayoutSolver,
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
  private readonly solver: LayoutSolver

  constructor(solver?: LayoutSolver) {
    this.solver = solver ?? new LayoutSolver()
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
    return this.solver.addConstraint(left, operator, right, strength)
  }

  solve() {
    this.solver.updateVariables()
  }

  valueOf(variable: LayoutVar): number {
    return variable.value()
  }

}
