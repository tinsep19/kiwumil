// src/core/solver.ts
// レイアウトソルバーのインターフェースとレイアウト制約の型定義を統合

import type { VariableId, LayoutConstraintId, LinearConstraintsId } from "./types"
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
 * LinearConstraints: 複数の線形制約を表す基本インターフェース
 */
export interface LinearConstraints {
  id: LinearConstraintsId
  rawConstraints: LinearConstraint[]
}

/**
 * LayoutConstraint: ブランド型としてのレイアウト制約
 * LinearConstraintsにブランドを追加した型
 * この型はコンパイル時の型チェックのためのもので、実装側で実際にプロパティを持つ必要はない
 */
export type LayoutConstraint = LinearConstraints & {
  readonly __layoutConstraintBrand: unique symbol
}

/**
 * Term: Layout constraint term consisting of a coefficient and a variable or constant
 */
export type Term = [number, Variable | number]

/**
 * LhsBuilder: Interface for building left-hand side of constraints
 */
export interface LhsBuilder {
  expr(...lhs: Term[]): OpRhsBuilder
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
 * LayoutConstraintFactory: Factory interface for creating LayoutConstraint
 */
export interface LayoutConstraintFactory {
  createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): LayoutConstraint
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
   * Create constraints with an ID using a callback pattern
   * Returns LinearConstraints (branded version of LayoutConstraint)
   */
  createConstraints(id: LinearConstraintsId, spec: ConstraintSpec): LinearConstraints

  /**
   * Create a fluent edit variable handle
   */
  createHandle(variable: Variable): SuggestHandleFactory
}

/**
 * createLayoutConstraintFactory: Factory function to create a LayoutConstraintFactory
 * that wraps a function returning LinearConstraints
 * 
 * @param factory Function that returns a function creating LinearConstraints
 * @returns LayoutConstraintFactory instance
 */
export function createLayoutConstraintFactory(
  factory: () => (id: LinearConstraintsId, spec: ConstraintSpec) => LinearConstraints
): LayoutConstraintFactory {
  return {
    createConstraint(id: LayoutConstraintId, spec: ConstraintSpec): LayoutConstraint {
      // Use the factory function internally and cast the result to LayoutConstraint.
      // NOTE: This cast is safe because LayoutConstraint's __layoutConstraintBrand is a
      // type-level brand (unique symbol) that exists only at compile time and is not
      // meant to be instantiated at runtime. LinearConstraints is structurally compatible
      // with LayoutConstraint minus the phantom brand property.
      const createFn = factory()
      return createFn(id as LinearConstraintsId, spec) as LayoutConstraint
    }
  }
}

