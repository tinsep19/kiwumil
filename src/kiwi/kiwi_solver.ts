// src/kiwi/kiwi_solver.ts
// kiwi 依存を集約するラッパーモジュール
import * as kiwi from "@lume/kiwi"
import { KiwiConstraintBuilder } from "./constraints_builder"
import { KiwiSuggestHandleFactory } from "./suggest_handle"
import type {
  VariableId,
  Variable,
  LinearConstraintsId,
  LinearConstraints,
  SuggestHandleFactory,
  CassowarySolver,
} from "../core"
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
    // Use Reflect.defineProperty to avoid using `any` and keep the property non-enumerable
    Reflect.defineProperty(obj as object, KIWI_BRAND, {
      value: true,
      enumerable: false,
      configurable: true,
      writable: true,
    })
  }
}

/**
 * Check if an object has been branded by our kiwi wrapper
 * @param obj Object to check
 * @returns true if the object has been branded
 */
export function isBrandedKiwi(obj: unknown): boolean {
  return Boolean(obj && typeof obj === "object" && Reflect.get(obj as object, KIWI_BRAND))
}

export class KiwiVariable implements Variable {
  constructor(
    public readonly id: VariableId,
    public readonly variable: kiwi.Variable
  ) {}

  value(): number {
    return this.variable.value()
  }
}

/**
 * Unique symbol used to brand KiwiLinearConstraints
 * @internal
 */
const KIWI_CONSTRAINT_BRAND: unique symbol = Symbol("KIWI_CONSTRAINT_BRAND")

/**
 * KiwiLinearConstraints: KiwiSolver によって生成された線形制約
 * LinearConstraints を拡張し、kiwi 固有の型情報とブランドを持つ
 */
export interface KiwiLinearConstraints extends LinearConstraints {
  rawConstraints: kiwi.Constraint[]
  readonly __kiwiConstraintBrand: typeof KIWI_CONSTRAINT_BRAND
}

/**
 * kiwi.Solver のラッパークラス
 * ソルバーのライフサイクル管理と操作を集約
 */
export class KiwiSolver implements CassowarySolver {
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
   * Create constraints with an ID using a callback pattern
   * @param id Constraint identifier
   * @param spec Builder callback function
   * @returns KiwiLinearConstraints with id, rawConstraints, and Kiwi brand
   */
  createConstraints(id: LinearConstraintsId, spec: ConstraintSpec): KiwiLinearConstraints {
    const builder = new KiwiConstraintBuilder(this.solver)
    spec(builder)
    const constraint: KiwiLinearConstraints = {
      id,
      rawConstraints: builder.getRawConstraints(),
      __kiwiConstraintBrand: KIWI_CONSTRAINT_BRAND,
    }
    brandAsKiwi(constraint)
    return constraint
  }

  /**
   * Fluent edit variable handle を作成
   */
  createHandle(variable: Variable): SuggestHandleFactory {
    if (!isKiwiVariable(variable)) {
      throw new Error(
        "KiwiSolver.createHandle: variable must be a KiwiVariable created by KiwiSolver"
      )
    }
    return new KiwiSuggestHandleFactory(this.solver, variable.variable)
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
    typeof (v as { value?: unknown }).value === "function"
  )
}

/**
 * Check if a value is a KiwiLinearConstraints created by KiwiSolver
 * @param v Value to check
 * @returns true if v is a KiwiLinearConstraints with the proper brand
 */
export function isKiwiLinearConstraints(v: unknown): v is KiwiLinearConstraints {
  return (
    isBrandedKiwi(v) &&
    typeof v === "object" &&
    v !== null &&
    "id" in v &&
    "rawConstraints" in v &&
    "__kiwiConstraintBrand" in v &&
    (v as { __kiwiConstraintBrand?: unknown }).__kiwiConstraintBrand === KIWI_CONSTRAINT_BRAND
  )
}
