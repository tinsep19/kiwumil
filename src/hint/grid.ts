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
export class Grid {
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
  /** Container for the grid */
  container: IContainerSymbolCharacs

  constructor(
    rows: number,
    cols: number,
    x: AnchorX[],
    y: AnchorY[],
    width: Width[],
    height: Height[],
    container: IContainerSymbolCharacs
  ) {
    this.rows = rows
    this.cols = cols
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.container = container
  }

  /**
   * Get a cell area based on grid indices
   * @param bounds - Grid indices {top, left, bottom, right}
   * @returns Cell with left, top, right, bottom anchors
   */
  getArea(bounds: { top: number; left: number; bottom: number; right: number }): Cell {
    const { top, left, bottom, right } = bounds

    // Validate bounds
    if (top < 0 || top > this.rows || bottom < 0 || bottom > this.rows) {
      throw new Error(`Invalid row indices: top=${top}, bottom=${bottom}. Must be in [0, ${this.rows}]`)
    }
    if (left < 0 || left > this.cols || right < 0 || right > this.cols) {
      throw new Error(`Invalid column indices: left=${left}, right=${right}. Must be in [0, ${this.cols}]`)
    }
    if (top >= bottom) {
      throw new Error(`Invalid row indices: top=${top} must be less than bottom=${bottom}`)
    }
    if (left >= right) {
      throw new Error(`Invalid column indices: left=${left} must be less than right=${right}`)
    }

    const xLeft = this.x[left]
    const yTop = this.y[top]
    const xRight = this.x[right]
    const yBottom = this.y[bottom]

    if (!xLeft || !yTop || !xRight || !yBottom) {
      throw new Error(`Grid coordinates not properly initialized`)
    }

    return {
      left: xLeft,
      top: yTop,
      right: xRight,
      bottom: yBottom,
    }
  }
}
