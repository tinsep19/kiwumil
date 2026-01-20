// src/domain/value/constraint/constraint.ts

import type { Term } from "./term"
import type { ConstraintOperator } from "./constraint_operator"
import type { ConstraintStrength } from "./constraint_strength"

/**
 * Constraint: 制約式の抽象構文木（AST）
 * あとで isSatisfied() を評価可能にするために保持する
 */
export interface Constraint {
  lhs: Term[]
  rhs: Term[]
  op: ConstraintOperator
  strength: ConstraintStrength
}
