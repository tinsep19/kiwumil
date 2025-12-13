// src/kiwi/kiwi_solver.ts
// kiwi 依存を集約するラッパーモジュール
import * as kiwi from "@lume/kiwi"
import { KiwiConstraintBuilder } from "./constraints_builder"
import type { VariableId, ILayoutVariable, ConstraintStrength, ISuggestHandle, LayoutConstraintId, ILayoutConstraint, ISuggestHandleFactory, ILayoutSolver } from "../core"
import type { ConstraintSpec } from "../core"

/**
 * Unique symbol used to brand objects created by KiwiSolver
 * @internal
 */
const KIWI_BRAND: unique symbol = Symbol("KIWI_BRAND")

/**
 * Brand an object as created by our kiwi wrapper
 * @internal
 */
function brandAsKiwi(obj: unknown): void {
  if (obj && typeof obj === "object") {
    ;(obj as any)[KIWI_BRAND] = true
  }
}

/**
 * Check if an object has been branded by our kiwi wrapper
 * @param obj Object to check
 * @returns true if the object has been branded
 */
export function isBrandedKiwi(obj: unknown): boolean {
  return !!(obj && typeof obj === "object" && (obj as any)[KIWI_BRAND])
}

export class KiwiVariable implements ILayoutVariable {
  constructor(
    public readonly id: VariableId,
    public readonly variable: kiwi.Variable
  ) {}

  value(): number {
    return this.variable.value()
  }
}

export interface KiwiConstraint extends ILayoutConstraint {
  rawConstraints: kiwi.Constraint[]
}

/**
 * kiwi.Solver のラッパークラス
 * ソルバーのライフサイクル管理と操作を集約
 */
export class KiwiSolver implements ILayoutSolver {
  private readonly solver: kiwi.Solver

  constructor() {
    this.solver = new kiwi.Solver()
  }

  /**
   * Create a KiwiVariable
   */
  createVariable(id: VariableId): KiwiVariable {
    const variable = new kiwi.Variable(id)
    const kiwiVariable = new KiwiVariable(id, variable)
    brandAsKiwi(kiwiVariable)
    return kiwiVariable
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
   * @returns KiwiConstraint with id and rawConstraints
   */
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): KiwiConstraint {
    const builder = new KiwiConstraintBuilder(this.solver)
    spec(builder)
    const constraint = {
      id,
      rawConstraints: builder.getRawConstraints(),
    }
    brandAsKiwi(constraint)
    return constraint
  }

  /**
   * Fluent edit variable handle を作成
   */
  createHandle(variable: ILayoutVariable): ISuggestHandleFactory {
    if (!isKiwiVariable(variable)) {
      throw new Error("KiwiSolver.createHandle: variable must be a KiwiVariable created by KiwiSolver")
    }
    return new KiwiSuggestHandleFactory(this.solver, variable)
  }
}

/** @internal */
class KiwiSuggestHandle implements ISuggestHandle {
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
class KiwiSuggestHandleFactory implements ISuggestHandleFactory {
  constructor(private readonly solver: kiwi.Solver, private readonly variable: ILayoutVariable) {}

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
    this.solver.addEditVariable(this.variable.variable as kiwi.Variable, strength)
    return new KiwiSuggestHandle(this.solver, this.variable.variable as kiwi.Variable, label)
  }
}

/**
 * Check if a value is a KiwiVariable created by KiwiSolver
 * @param v Value to check
 * @returns true if v is a branded KiwiVariable
 */
export function isKiwiVariable(v: unknown): v is KiwiVariable {
  return (
    isBrandedKiwi(v) &&
    typeof v === "object" &&
    v !== null &&
    "id" in v &&
    "variable" in v &&
    "value" in v &&
    typeof (v as any).value === "function"
  )
}

