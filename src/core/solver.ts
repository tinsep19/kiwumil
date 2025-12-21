// src/core/solver.ts
// レイアウトソルバーのインターフェースとレイアウト制約の型定義を統合

import type { VariableId, LayoutConstraintId } from "./types"
import type { Variable } from "./layout_variable"

/**
 * ConstraintStrength: 制約の強度
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

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
 * Term: Layout constraint term consisting of a coefficient and a variable or constant
 */
export type Term = [number, Variable | number]

/**
 * LhsBuilder: Interface for building left-hand side of constraints
 */
export interface LhsBuilder {
  ct(...lhs: Term[]): OpRhsBuilder
}

/**
 * OpRhsBuilder: Interface for building operator and right-hand side of constraints
 */
export interface OpRhsBuilder {
  eq(...rhs: Term[]): StrengthBuilder
  ge(...rhs: Term[]): StrengthBuilder
  le(...rhs: Term[]): StrengthBuilder
  eq0(): StrengthBuilder
  ge0(): StrengthBuilder
  le0(): StrengthBuilder
}

/**
 * StrengthBuilder: Interface for setting constraint strength
 */
export interface StrengthBuilder {
  required(): void
  strong(): void
  medium(): void
  weak(): void
}

/**
 * LinearConstraintBuilder: Constraint builder interface
 */
export interface LinearConstraintBuilder extends LhsBuilder, OpRhsBuilder, StrengthBuilder {
  getRawConstraints(): LinearConstraint[]
}

/**
 * ConstraintSpec: Callback function that builds constraints using LinearConstraintBuilder
 */
export type ConstraintSpec = (builder: LinearConstraintBuilder) => void

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
