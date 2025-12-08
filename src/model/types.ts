// src/model/types.ts

export type SymbolId = string

declare const CONTAINER_SYMBOL_ID: unique symbol
export type ContainerSymbolId = SymbolId & { readonly [CONTAINER_SYMBOL_ID]: true }

export type RelationshipId = string

export interface Point {
  x: number
  y: number
}