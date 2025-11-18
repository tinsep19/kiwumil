// src/model/types.ts

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds extends Position, Size {}

export type SymbolId = string

declare const CONTAINER_SYMBOL_ID: unique symbol
export type ContainerSymbolId = SymbolId & { readonly [CONTAINER_SYMBOL_ID]: true }

export function toContainerSymbolId(id: SymbolId): ContainerSymbolId {
  return id as ContainerSymbolId
}

export type RelationshipId = string

export interface Point {
  x: number
  y: number
}
