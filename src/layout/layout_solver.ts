// src/layout/layout_solver.ts
// kiwi 依存を集約するラッパーモジュール
import * as kiwi from "@lume/kiwi"
import { ConstraintsBuilder } from "./constraints_builder"
import type { VariableId, ILayoutVariable, SuggestHandleStrength, SuggestHandle, LayoutConstraintId, ILayoutConstraint, SuggestHandleFactory } from "../core/symbols"

export type ConstraintSpec = (builder: ConstraintsBuilder) => void

export class LayoutVariable implements ILayoutVariable {
  constructor(
    public readonly id: VariableId,
    public readonly variable: kiwi.Variable
  ) {}

  value(): number {
    return this.variable.value()
  }
}

export interface LayoutConstraint extends ILayoutConstraint {
  rawConstraints: kiwi.Constraint[]
}

/**
 * kiwi.Solver のラッパークラス
 * ソルバーのライフサイクル管理と操作を集約
 */
export class LayoutSolver {
  private readonly solver: kiwi.Solver

  constructor() {
    this.solver = new kiwi.Solver()
  }

  /**
   * Create a LayoutVariable
   */
  createLayoutVariable(id: VariableId): LayoutVariable {
    const variable = new kiwi.Variable(id)
    return new LayoutVariable(id, variable)
  }

  /**
   * 変数を更新
   */
  updateVariables(): void {
    this.solver.updateVariables()
  }

  /**
   * Create a constraint with an ID using a callback pattern
   * @param id Constraint identifier
   * @param spec Builder callback function
   * @returns LayoutConstraint with id and rawConstraints
   */
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): LayoutConstraint {
    const builder = new ConstraintsBuilder(this.solver)
    spec(builder)
    return {
      id,
      rawConstraints: builder.getRawConstraints(),
    }
  }

  /**
   * Fluent edit variable handle を作成
   */
  createHandle(variable: LayoutVariable): SuggestHandleFactory {
    return new SuggestHandleFactoryImpl(this.solver, variable)
  }
}

/** @internal */
class SuggestHandleImpl implements SuggestHandle {
  private disposed = false

  constructor(
    private readonly solver: kiwi.Solver,
    private readonly variable: LayoutVariable,
    private readonly label: SuggestHandleStrength
  ) {}

  suggest(value: number): void {
    this.ensureActive()
    this.solver.suggestValue(this.variable.variable, value)
  }

  strength(): SuggestHandleStrength {
    return this.label
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.solver.removeEditVariable(this.variable.variable)
    this.disposed = true
  }

  private ensureActive(): void {
    if (this.disposed) {
      throw new Error("SuggestHandle: already disposed")
    }
  }
}

/** @internal */
class SuggestHandleFactoryImpl implements SuggestHandleFactory {
  constructor(private readonly solver: kiwi.Solver, private readonly variable: LayoutVariable) {}

  strong(): SuggestHandle {
    return this.createHandle("strong", kiwi.Strength.strong)
  }

  medium(): SuggestHandle {
    return this.createHandle("medium", kiwi.Strength.medium)
  }

  weak(): SuggestHandle {
    return this.createHandle("weak", kiwi.Strength.weak)
  }

  private createHandle(label: SuggestHandleStrength, strength: number): SuggestHandle {
    this.solver.addEditVariable(this.variable.variable, strength)
    return new SuggestHandleImpl(this.solver, this.variable, label)
  }
}

