import { ConstraintRegistrar } from "@/domain/service/constraint_registrar"
import type { Constraint } from "@/domain/value/constraint/constraint"
import type { LinearConstraint } from "@/domain/ports/solver.ts"
import type { ConstraintSpec } from "@/domain/dsl/constraint_spec"
import type { ConstraintBuilder } from "@/domain/dsl/constraint_builder"
import { DefaultConstraintBuilder } from "@/domain/dsl/constraint_builder"

export type LayoutConstraintId = string
export type ConstraintType = "geometric" | "user-hint" | "symbol-internal" | "item-internal"

class LayoutConstraint<T extends ConstraintType> {
  private _constraints: LinearConstraint[] = []
  private readonly builder: ConstraintBuilder

  constructor(
    readonly id: LayoutConstraintId,
    readonly type: T,
    private readonly registrar: ConstraintRegistrar
  ) {
    this.builder = new DefaultConstraintBuilder<void>((expr: Constraint) => {
      const linearConstraint = this.registrar.register(expr)
      this._constraints.push(linearConstraint)
    })
  }
  get constraints() {
    return [...this._constraints]
  }

  addConstraint(spec: ConstraintSpec) {
    spec(this.builder)
  }

  clear() {
    const tmp = this._constraints
    this._constraints = []
    for (const ct of tmp) {
      this.registrar.remove(ct)
    }
  }

  compact() {
    const tmp = this._constraints
    this._constraints = []
    for (const ct of tmp) {
      if (ct.isRegistered()) {
        this._constraints.push(ct)
      }
    }
  }
}

export type GeometricConstraint = LayoutConstraint<"geometric">
export type SymbolConstraint = LayoutConstraint<"symbol-internal">
export type ItemConstraint = LayoutConstraint<"item-internal">
export type UserHintConstraint = LayoutConstraint<"user-hint">
