// src/model/types.ts

export type SymbolId = string

// ContainerSymbolId をブランド型から単純エイリアスに変更して互換性を保つ
export type ContainerSymbolId = SymbolId

export type RelationshipId = string

export interface Point {
  x: number
  y: number
}