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

/**
 * Diagram 全体を表すコンテナID（固定値）
 * hint.grid() / hint.figure() で引数省略時にデフォルトで使用される
 */
export const DIAGRAM_CONTAINER_ID = "__diagram__" as ContainerSymbolId

export type RelationshipId = string

export interface Point {
  x: number
  y: number
}
