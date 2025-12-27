// src/hint/grid.ts

import type { Variable, AnchorX, AnchorY, Width, Height, IContainerSymbolCharacs } from "../core"

/**
 * Cell represents a bounded area in the grid
 */
export interface Cell {
  left: Variable
  top: Variable
  right: Variable
  bottom: Variable
}

/**
 * Grid represents the data and structure of a grid layout
 */
export interface Grid {
  /** Number of rows in the grid */
  readonly rows: number
  /** Number of columns in the grid */
  readonly cols: number
  /** Vertical guide lines (M+1 guides for M columns) */
  readonly x: AnchorX[]
  /** Horizontal guide lines (N+1 guides for N rows) */
  readonly y: AnchorY[]
  /** Column widths (M widths for M columns) */
  readonly width: Width[]
  /** Row heights (N heights for N rows) */
  readonly height: Height[]
  /** Optional container for the grid */
  container?: IContainerSymbolCharacs
}
