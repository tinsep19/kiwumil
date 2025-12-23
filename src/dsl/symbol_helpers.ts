// src/dsl/symbol_helpers.ts

import type { SymbolId, ISymbolCharacs, IContainerSymbolCharacs } from "../core"

/**
 * Type alias for DSL helpers - accepts only ISymbolCharacs.
 * No longer accepts SymbolId strings.
 */
export type SymbolOrId = ISymbolCharacs

/**
 * Type alias for container symbols - accepts only IContainerSymbolCharacs.
 * No longer accepts SymbolId strings.
 */
export type ContainerSymbolOrId = IContainerSymbolCharacs

/**
 * Resolve a symbol identifier from ISymbolCharacs.
 * Also accepts IContainerSymbolCharacs since it extends ISymbolCharacs.
 */
export function toSymbolId(symbol: ISymbolCharacs): SymbolId {
  return symbol.id
}
