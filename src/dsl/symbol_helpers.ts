// src/dsl/symbol_helpers.ts
import type { ContainerSymbol, ContainerSymbolId, SymbolBase, SymbolId } from "../model"

/**
 * SymbolBase or SymbolId union for DSL helpers.
 */
export type SymbolOrId = SymbolBase | SymbolId

/**
 * ContainerSymbol or its ID type.
 */
export type ContainerSymbolOrId = ContainerSymbol | ContainerSymbolId

/**
 * Resolve a symbol identifier from a SymbolBase or SymbolId.
 */
export function toSymbolId(symbol: SymbolOrId): SymbolId {
  return typeof symbol === "string" ? symbol : symbol.id
}

/**
 * Resolve a container symbol identifier from a ContainerSymbol or ContainerSymbolId.
 */
export function toContainerSymbolId(container: ContainerSymbolOrId): ContainerSymbolId {
  return typeof container === "string" ? container : (container.id as ContainerSymbolId)
}
