// src/core/constraint.ts
// 制約関連のインターフェースと型定義

import type { LayoutConstraintId, BoundId } from "./types"
import type { LayoutVariable, ConstraintStrength } from "./layout_variable"
import type { LayoutBounds, ContainerBounds } from "./bounds"

/**
 * LayoutConstraint: レイアウト制約のインターフェース
 */
export interface LayoutConstraint {
  id: LayoutConstraintId
}

/**
 * Term: Layout constraint term consisting of a coefficient and a variable or constant
 */
export type Term = [number, LayoutVariable | number]

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
export interface LinearConstraintBuilder extends LhsBuilder, OpRhsBuilder, StrengthBuilder {}

/**
 * ConstraintSpec: Callback function that builds constraints using LinearConstraintBuilder
 */
export type ConstraintSpec = (builder: LinearConstraintBuilder) => void

/**
 * HintTarget: 制約適用の対象となるシンボルの境界情報
 */
export interface HintTarget {
  readonly boundId: BoundId
  readonly bounds: LayoutBounds
  readonly container?: ContainerBounds
}

// Re-export ConstraintStrength for convenience
export type { ConstraintStrength }
