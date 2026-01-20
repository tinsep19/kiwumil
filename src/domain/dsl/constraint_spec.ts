// src/domain/dsl/constraint_spec.ts

import type { ConstraintBuilder } from "./constraint_builder"

/**
 * ConstraintSpec: 制約を構築するコールバック関数
 */
export type ConstraintSpec = (builder: ConstraintBuilder) => void
