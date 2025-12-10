// src/core/constraint.ts
// 制約関連のインターフェースと型定義

import type { LayoutConstraintId, BoundId } from "./types"
import type { ILayoutVariable, ConstraintStrength } from "./layout_variable"
import type { LayoutBounds, ContainerBounds } from "./bounds"

/**
 * ILayoutConstraint: レイアウト制約のインターフェース
 */
export interface ILayoutConstraint {
  id: LayoutConstraintId
}

/**
 * Term: Layout constraint term consisting of a coefficient and a variable or constant
 */
export type Term = [number, ILayoutVariable | number]

/**
 * IConstraintsBuilder: Constraint builder interface
 */
export interface IConstraintsBuilder {
  expr(...lhs: Term[]): this
  eq(...rhs: Term[]): this
  ge(...rhs: Term[]): this
  le(...rhs: Term[]): this
  eq0(): this
  ge0(): this
  le0(): this
  required(): this
  strong(): this
  medium(): this
  weak(): this
}

/**
 * ConstraintSpec: Callback function that builds constraints using IConstraintsBuilder
 */
export type ConstraintSpec = (builder: IConstraintsBuilder) => void

/**
 * HintTarget: 制約適用の対象となるシンボルの境界情報
 */
export interface HintTarget {
  readonly boundId: BoundId
  readonly layout: LayoutBounds
  readonly container?: ContainerBounds
}

// Re-export ConstraintStrength for convenience
export type { ConstraintStrength }
