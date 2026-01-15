import * as kiwi from "@lume/kiwi"
import type { ICassowarySolver } from "../cassowary/cassowary-solver.interface"
import type { FreeVariable, LinearConstraint } from "../cassowary/types"
import type { ConstraintSpec, ConstraintStrength, SuggestHandle } from "../../../core/solver"
import { KiwiConstraintBuilder } from "./constraint_builder"
import { KiwiSuggestHandle } from "./suggest_handle"

/**
 * KiwiSolver: ICassowarySolver の Kiwi 実装
 * 
 * 純粋な Cassowary ソルバーとして動作し、id を管理しません。
 */
export class KiwiSolver implements ICassowarySolver {
  private readonly solver: kiwi.Solver

  constructor() {
    this.solver = new kiwi.Solver()
  }

  createVariable(name = "anonymous"): FreeVariable {
    // ✅ kiwi.Variable をそのまま返す（ラッパー不要）
    const kiwiVar = new kiwi.Variable(name)
    return kiwiVar as FreeVariable
  }

  createConstraint(spec: ConstraintSpec): LinearConstraint[] {
    const builder = new KiwiConstraintBuilder(this.solver)
    spec(builder)
    return builder.getRawConstraints() as LinearConstraint[]
  }

  updateVariables(): void {
    this.solver.updateVariables()
  }

  createHandle(variable: FreeVariable, strength: ConstraintStrength): SuggestHandle {
    const kiwiVar = variable as unknown as kiwi.Variable
    const kiwiStrength = this.convertStrength(strength)
    this.solver.addEditVariable(kiwiVar, kiwiStrength)
    return new KiwiSuggestHandle(this.solver, kiwiVar, strength)
  }

  private convertStrength(strength: ConstraintStrength): number {
    switch (strength) {
      case "required":
        return kiwi.Strength.required
      case "strong":
        return kiwi.Strength.strong
      case "medium":
        return kiwi.Strength.medium
      case "weak":
        return kiwi.Strength.weak
      default:
        const _exhaustive: never = strength
        throw new Error(`Unknown strength: ${_exhaustive}`)
    }
  }
}
