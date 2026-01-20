// src/domain/ports/index.ts
export * from "./solver"
export * from "./symbol"
export * from "./relationship"
export * from "./renderer"
export * from "./icon_provider"

// Re-export constraint types for backward compatibility
export type { FreeVariable } from "../value/constraint/free_variable"
export type { Constraint } from "../value/constraint/constraint"
export type { ConstraintStrength } from "../value/constraint/constraint_strength"
export type { ConstraintOperator } from "../value/constraint/constraint_operator"
export type { Term } from "../value/constraint/term"
