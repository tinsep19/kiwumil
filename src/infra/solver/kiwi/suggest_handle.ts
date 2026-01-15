import * as kiwi from "@lume/kiwi"
import type { SuggestHandle, ConstraintStrength } from "../../../core"

/**
 * KiwiSuggestHandle: SuggestHandle の Kiwi 実装
 */
export class KiwiSuggestHandle implements SuggestHandle {
  constructor(
    private readonly solver: kiwi.Solver,
    private readonly variable: kiwi.Variable,
    private readonly constraintStrength: ConstraintStrength
  ) {}

  suggest(value: number): void {
    this.solver.suggestValue(this.variable, value)
  }

  strength(): ConstraintStrength {
    return this.constraintStrength
  }

  dispose(): void {
    this.solver.removeEditVariable(this.variable)
  }
}
