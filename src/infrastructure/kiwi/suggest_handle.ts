// src/infrastructure/kiwi/suggest_handle.ts
// Suggest handle implementation for kiwi solver

import * as kiwi from "@lume/kiwi"
import type { ConstraintStrength, SuggestHandle, SuggestHandleFactory } from "../../core"

/** @internal */
export class KiwiSuggestHandle implements SuggestHandle {
  private disposed = false

  constructor(
    private readonly solver: kiwi.Solver,
    private readonly variable: kiwi.Variable,
    private readonly strengthLabel: ConstraintStrength
  ) {}

  suggest(value: number): void {
    this.ensureActive()
    this.solver.suggestValue(this.variable, value)
  }

  strength(): ConstraintStrength {
    return this.strengthLabel
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.solver.removeEditVariable(this.variable)
    this.disposed = true
  }

  private ensureActive(): void {
    if (this.disposed) {
      throw new Error("SuggestHandle: already disposed")
    }
  }
}

/** @internal */
export class KiwiSuggestHandleFactory implements SuggestHandleFactory {
  constructor(
    private readonly solver: kiwi.Solver,
    private readonly variable: kiwi.Variable
  ) {}

  strong(): SuggestHandle {
    return this.createHandle("strong", kiwi.Strength.strong)
  }

  medium(): SuggestHandle {
    return this.createHandle("medium", kiwi.Strength.medium)
  }

  weak(): SuggestHandle {
    return this.createHandle("weak", kiwi.Strength.weak)
  }

  private createHandle(label: ConstraintStrength, strength: number): SuggestHandle {
    this.solver.addEditVariable(this.variable, strength)
    return new KiwiSuggestHandle(this.solver, this.variable, label)
  }
}
