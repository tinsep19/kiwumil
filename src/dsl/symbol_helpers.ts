// src/dsl/symbol_helpers.ts
import type { ContainerSymbol } from "../model"
import type { SymbolId, ISymbolCharacs, IContainerSymbolCharacs } from "../core"

/**
 * ISymbolCharacs or SymbolId union for DSL helpers.
 */
export type SymbolOrId = ISymbolCharacs | SymbolId

/**
 * IContainerSymbolCharacs (which extends ISymbolCharacs with container property) or its ID type.
 */
export type ContainerSymbolOrId = IContainerSymbolCharacs | SymbolId

/**
 * Resolve a symbol identifier from ISymbolCharacs or SymbolId.
 * Also accepts IContainerSymbolCharacs since it extends ISymbolCharacs.
 */
export function toSymbolId(symbol: SymbolOrId): SymbolId {
  return typeof symbol === "string" ? symbol : symbol.id
}
