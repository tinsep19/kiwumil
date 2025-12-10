// src/core/constraints_builder.ts
import type { ILayoutVariable } from "./symbols"

/**
 * Term: Layout constraint term consisting of a coefficient and a variable or constant
 */
export type Term = [number, ILayoutVariable | number]

/**
 * ConstraintSpec: Callback function that builds constraints using IConstraintsBuilder
 */
export type ConstraintSpec = (builder: IConstraintsBuilder) => void

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
