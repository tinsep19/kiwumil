// src/layout/layout_variable_context.ts
import * as kiwi from "@lume/kiwi"

const LAYOUT_VAR_BRAND = Symbol("LayoutVarBrand")

export type LayoutVar = kiwi.Variable & { readonly [LAYOUT_VAR_BRAND]: true }

export interface LayoutTerm {
  variable: LayoutVar
  coefficient?: number
}

export interface LayoutExpression {
  terms?: LayoutTerm[]
  constant?: number
}

type LayoutExpressionInput = LayoutExpression | LayoutVar | number

function isLayoutVar(input: LayoutExpressionInput): input is LayoutVar {
  return typeof input === "object" && input !== null && LAYOUT_VAR_BRAND in input
}

function isLayoutExpression(input: LayoutExpressionInput): input is LayoutExpression {
  if (typeof input !== "object" || input === null) {
    return false
  }
  if (isLayoutVar(input)) {
    return false
  }
  return "terms" in input || "constant" in input
}

export const LayoutConstraintOperator = Object.freeze({
  Eq: kiwi.Operator.Eq,
  Ge: kiwi.Operator.Ge,
  Le: kiwi.Operator.Le
} as const)
export type LayoutConstraintOperator =
  (typeof LayoutConstraintOperator)[keyof typeof LayoutConstraintOperator]

export const LayoutConstraintStrength = Object.freeze({
  required: kiwi.Strength.required,
  strong: kiwi.Strength.strong,
  weak: kiwi.Strength.weak
} as const)
export type LayoutConstraintStrength =
  (typeof LayoutConstraintStrength)[keyof typeof LayoutConstraintStrength]

export class LayoutVariableContext {
  private readonly solver: kiwi.Solver

  constructor(solver?: kiwi.Solver) {
    this.solver = solver ?? new kiwi.Solver()
  }

  createVar(name: string): LayoutVar {
    const variable = new kiwi.Variable(name)
    Object.defineProperty(variable, LAYOUT_VAR_BRAND, {
      value: true,
      enumerable: false,
      configurable: false
    })
    return variable as LayoutVar
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
    const leftExpr = this.toKiwiExpression(left)
    const rightExpr = this.toKiwiExpression(right)
    const constraint = new kiwi.Constraint(
      leftExpr,
      operator,
      rightExpr,
      strength
    )
    this.solver.addConstraint(constraint)
  }

  solve() {
    this.solver.updateVariables()
  }

  valueOf(variable: LayoutVar): number {
    return variable.value()
  }

  private toKiwiExpression(input: LayoutExpressionInput): kiwi.Expression {
    if (typeof input === "number") {
      return new kiwi.Expression(input)
    }
    if (isLayoutVar(input)) {
      return new kiwi.Expression(input)
    }
    if (isLayoutExpression(input)) {
      let expr = new kiwi.Expression(input.constant ?? 0)
      for (const term of input.terms ?? []) {
        const coefficient = term.coefficient ?? 1
        const termExpr = new kiwi.Expression(term.variable)
        expr = coefficient === 1 ? expr.plus(termExpr) : expr.plus(termExpr.multiply(coefficient))
      }
      return expr
    }
    throw new Error("Unsupported expression input")
  }

}
