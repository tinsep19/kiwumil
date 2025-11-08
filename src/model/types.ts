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
