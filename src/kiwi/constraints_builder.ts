import * as kiwi from "@lume/kiwi"

import type { Term, IConstraintsBuilder } from "../core"
import { isBrandedKiwi } from "./layout_solver"

interface PendingConstraint {
  lhs?: Term[]
  rhs?: Term[]
  op?: kiwi.Operator
}

/**
 * Fluent constraint builder inspired by docs/draft/new_constraint_builder.md
 */
export class ConstraintsBuilder implements IConstraintsBuilder {
  readonly rawConstraints: kiwi.Constraint[] = []
  private tmp: PendingConstraint = {}

  constructor(private readonly solver: kiwi.Solver) {}

  expr(...lhs: Term[]): this {
    this.tmp = { lhs }
    return this
  }

  eq(...rhs: Term[]): this {
    this.ensureExpr()
    this.tmp = {
      ...this.tmp,
      rhs,
      op: kiwi.Operator.Eq,
    }
    return this
  }

  ge(...rhs: Term[]): this {
    this.ensureExpr()
    this.tmp = {
      ...this.tmp,
      rhs,
      op: kiwi.Operator.Ge,
    }
    return this
  }

  le(...rhs: Term[]): this {
    this.ensureExpr()
    this.tmp = {
      ...this.tmp,
      rhs,
      op: kiwi.Operator.Le,
    }
    return this
  }

  eq0(): this {
    this.ensureExpr()
    this.tmp = {
      ...this.tmp,
      rhs: [[0, 1]],
      op: kiwi.Operator.Eq,
    }
    return this
  }

  ge0(): this {
    this.ensureExpr()
    this.tmp = {
      ...this.tmp,
      rhs: [[0, 1]],
      op: kiwi.Operator.Ge,
    }
    return this
  }

  le0(): this {
    this.ensureExpr()
    this.tmp = {
      ...this.tmp,
      rhs: [[0, 1]],
      op: kiwi.Operator.Le,
    }
    return this
  }

  required(): this {
    return this.finalize(kiwi.Strength.required)
  }

  strong(): this {
    return this.finalize(kiwi.Strength.strong)
  }

  medium(): this {
    return this.finalize(kiwi.Strength.medium)
  }

  weak(): this {
    return this.finalize(kiwi.Strength.weak)
  }

  getRawConstraints() {
    return this.rawConstraints
  }

  private ensureExpr() {
    if (!this.tmp.lhs) {
      throw new Error("ConstraintsBuilder: call expr(...) before defining rhs")
    }
  }

  private finalize(strength: number): this {
    const { lhs, rhs, op } = this.tmp
    if (!lhs || !rhs?.length || !op) {
      throw new Error("ConstraintsBuilder: incomplete constraint chain")
    }
    const constraint = new kiwi.Constraint(
      this.buildExpression(lhs),
      op,
      this.buildExpression(rhs),
      strength
    )
    this.solver.addConstraint(constraint)
    this.rawConstraints.push(constraint)
    this.tmp = {}
    return this
  }

  private buildExpression(terms: Term[]): kiwi.Expression {
    if (terms.length === 0) {
      return new kiwi.Expression(0)
    }

    const args: Array<
      number | kiwi.Variable | kiwi.Expression | [number, kiwi.Variable | kiwi.Expression]
    > = []

    for (const [coefficient, operand] of terms) {
      if (typeof operand === "number") {
        args.push(coefficient * operand)
        continue
      }

      // Validate that operand is a branded LayoutVariable
      if (!isBrandedKiwi(operand)) {
        throw new Error("ConstraintsBuilder: operand is not a LayoutVariable created by KiwiSolver")
      }

      // operand is ILayoutVariable, which has .variable property
      const kiwiVar = operand.variable as kiwi.Variable
      if (coefficient === 1) {
        args.push(kiwiVar)
      } else {
        args.push([coefficient, kiwiVar])
      }
    }

    return new kiwi.Expression(...args)
  }
}
