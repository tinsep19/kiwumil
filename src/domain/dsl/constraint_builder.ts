// src/domain/dsl/constraint_builder.ts

import type { Fluent, Entry, Step, Terminal } from "./fluent_builder_generator"
import type { Constraint } from "../value/constraint/constraint"
import type { Term } from "../value/constraint/term"

export type ConstraintBuilder<R = void> = Fluent<{
  init: {
    ct: Entry<[...lhs: Term[]]>
  }
  requiredGroups: {
    op: {
      eq: Step<[...rhs: Term[]]>
      le: Step<[...rhs: Term[]]>
      ge: Step<[...rhs: Term[]]>
      eq0: Step
      le0: Step
      ge0: Step
    }
  }
  terminal: {
    required: Terminal<[], R>
    strong: Terminal<[], R>
    medium: Terminal<[], R>
    weak: Terminal<[], R>
  }
}>

export class DefaultConstraintBuilder<R> implements ConstraintBuilder<R> {
  private pending: Partial<Constraint> = {}
  constructor(private process: (expr: Constraint) => R) {}
  private init(part: Partial<Constraint>) {
    this.pending = part
    return this
  }
  private update(part: Partial<Constraint>) {
    this.pending = { ...this.pending, ...part }
    return this
  }

  ct(...lhs: Term[]) {
    return this.init({ lhs })
  }

  eq(...rhs: Term[]) {
    return this.update({ op: "eq", rhs })
  }
  le(...rhs: Term[]) {
    return this.update({ op: "le", rhs })
  }
  ge(...rhs: Term[]) {
    return this.update({ op: "ge", rhs })
  }
  eq0() {
    return this.update({ op: "eq", rhs: [[0, 1]] })
  }
  le0() {
    return this.update({ op: "le", rhs: [[0, 1]] })
  }
  ge0() {
    return this.update({ op: "ge", rhs: [[0, 1]] })
  }

  required() {
    return this.finalize({ strength: "required" })
  }
  strong() {
    return this.finalize({ strength: "strong" })
  }
  medium() {
    return this.finalize({ strength: "medium" })
  }
  weak() {
    return this.finalize({ strength: "weak" })
  }

  isPendingComplete(pending: Partial<Constraint>): pending is Constraint {
    const { lhs, rhs, op, strength } = pending
    return lhs !== undefined && rhs !== undefined && op !== undefined && strength !== undefined
  }

  finalize(part: Partial<Constraint>): R {
    const expr = { ...this.pending, ...part }
    if (!this.isPendingComplete(expr)) {
      throw "pending expr is not complete!"
    }
    this.init({})
    return this.process(expr)
  }
}
