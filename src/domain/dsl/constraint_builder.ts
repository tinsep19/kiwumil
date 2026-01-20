// src/domain/dsl/constraint_builder.ts
// 制約ビルダーのインターフェース定義

import type { Term } from "../value/constraint/constraint"

/**
 * LinearConstraint: placeholder type for raw kiwi constraints
 * (具象ソルバー実装側で具体型を指定する)
 */
type LinearConstraint = unknown

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
