// src/layout/layout_solver.ts
// kiwi 依存を集約するラッパーモジュール
import * as kiwi from "@lume/kiwi"
import { LAYOUT_VAR_BRAND, type LayoutVar } from "./layout_types"
import { ConstraintsBuilder } from "./constraints_builder"

/**
 * ブランド付き LayoutVar を作成
 *
 * @param name - 変数名
 * @returns LayoutVar
 */
export function createLayoutVar(name: string): LayoutVar {
  const variable = new kiwi.Variable(name)
  Object.defineProperty(variable, LAYOUT_VAR_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
  })
  return variable as LayoutVar
}

export type { LayoutVar } from "./layout_types"

export type SuggestHandleStrength = "strong" | "medium" | "weak"

export interface SuggestHandle {
  suggest(value: number): void
  strength(): SuggestHandleStrength
  dispose(): void
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
   * 変数を更新
   */
  updateVariables(): void {
    this.solver.updateVariables()
  }

  /**
   * Fluent ConstraintBuilder を作成
   */
  createConstraintsBuilder(): ConstraintsBuilder {
    return new ConstraintsBuilder(this.solver)
  }

  /**
   * Fluent edit variable handle を作成
   */
  createHandle(variable: LayoutVar): SuggestHandleFactory {
    return new SuggestHandleFactoryImpl(this.solver, variable)
  }
}

/** @internal */
class SuggestHandleImpl implements SuggestHandle {
  private disposed = false

  constructor(
    private readonly solver: kiwi.Solver,
    private readonly variable: LayoutVar,
    private readonly label: SuggestHandleStrength
  ) {}

  suggest(value: number): void {
    this.ensureActive()
    this.solver.suggestValue(this.variable, value)
  }

  strength(): SuggestHandleStrength {
    return this.label
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

export interface SuggestHandleFactory {
  strong(): SuggestHandle
  medium(): SuggestHandle
  weak(): SuggestHandle
}

/** @internal */
class SuggestHandleFactoryImpl implements SuggestHandleFactory {
  constructor(private readonly solver: kiwi.Solver, private readonly variable: LayoutVar) {}

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
    this.solver.addEditVariable(this.variable, strength)
    return new SuggestHandleImpl(this.solver, this.variable, label)
  }
}
