// src/model/types.ts

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export type SymbolId = string

declare const CONTAINER_SYMBOL_ID: unique symbol
export type ContainerSymbolId = SymbolId & { readonly [CONTAINER_SYMBOL_ID]: true }

export type RelationshipId = string

export interface Point {
  x: number
  y: number
}
