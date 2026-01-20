// src/domain/value/constraint/term.ts

import type { FreeVariable } from "./free_variable"

/**
 * Term: 係数と変数（または定数）からなる項
 */
export type Term = [number, FreeVariable | number]
