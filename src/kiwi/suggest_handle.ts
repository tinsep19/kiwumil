// src/kiwi/suggest_handle.ts
// Suggest handle implementation for kiwi solver

import * as kiwi from "@lume/kiwi"
import type { ConstraintStrength, ISuggestHandle, ISuggestHandleFactory } from "../core"

/** @internal */
export class KiwiSuggestHandle implements ISuggestHandle {
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
export class KiwiSuggestHandleFactory implements ISuggestHandleFactory {
  constructor(private readonly solver: kiwi.Solver, private readonly variable: kiwi.Variable) {}

  strong(): ISuggestHandle {
    return this.createHandle("strong", kiwi.Strength.strong)
  }

  medium(): ISuggestHandle {
    return this.createHandle("medium", kiwi.Strength.medium)
  }

  weak(): ISuggestHandle {
    return this.createHandle("weak", kiwi.Strength.weak)
  }

  private createHandle(label: ConstraintStrength, strength: number): ISuggestHandle {
    this.solver.addEditVariable(this.variable, strength)
    return new KiwiSuggestHandle(this.solver, this.variable, label)
  }
}
