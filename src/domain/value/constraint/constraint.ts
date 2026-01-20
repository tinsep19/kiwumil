// src/domain/value/constraint/constraint.ts
// 制約関連の基本型定義

import type { Variable } from "../../../core/layout_variable"

/**
 * ConstraintStrength: 制約の強度
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

/**
 * Term: Layout constraint term consisting of a coefficient and a variable or constant
 */
export type Term = [number, Variable | number]
