// src/core/solver.ts
// レイアウトソルバーのインターフェースとレイアウト制約の型定義を統合

import type { VariableId, LayoutConstraintId } from "./types"
import type { Variable } from "./layout_variable"
import type { ConstraintStrength, Term } from "../domain/value/constraint/constraint"
import type {
  LinearConstraintBuilder,
  LhsBuilder,
  OpRhsBuilder,
  StrengthBuilder,
  ConstraintSpec,
} from "../domain/dsl/constraint_builder"


/**
 * SuggestHandle: レイアウト変数への値の提案を行うハンドル
 */
export interface SuggestHandle {
  suggest(value: number): void
  strength(): ConstraintStrength
  dispose(): void
}

/**
 * SuggestHandleFactory: SuggestHandleを作成するファクトリインターフェース
 */
export interface SuggestHandleFactory {
  strong(): SuggestHandle
  medium(): SuggestHandle
  weak(): SuggestHandle
}

/**
 * LinearConstraint: placeholder type for raw kiwi constraints
 * (具象ソルバー実装側で具体型を指定する)
 */
type LinearConstraint = unknown

/**
 * LayoutConstraint: レイアウト制約のインターフェース
 */
export interface LayoutConstraint {
  id: LayoutConstraintId
  rawConstraints: LinearConstraint[]
}

/**
 * CassowarySolver: Layout solver interface
 * (Previously named ILayoutSolver)
 */
export interface CassowarySolver {
  /**
   * Create a layout variable
   */
  createVariable(id: VariableId): Variable

  /**
   * Update variables
   */
  updateVariables(): void

  /**
   * Create a constraint with an ID using a callback pattern
   */
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): LayoutConstraint

  /**
   * Create a fluent edit variable handle
   */
  createHandle(variable: Variable): SuggestHandleFactory
}

// Re-export types from domain modules
export type { ConstraintStrength, Term } from "../domain/value/constraint/constraint"
export type {
  LinearConstraintBuilder,
  LhsBuilder,
  OpRhsBuilder,
  StrengthBuilder,
  ConstraintSpec,
} from "../domain/dsl/constraint_builder"
