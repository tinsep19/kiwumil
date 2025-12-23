// src/hint/fluent_grid_builder.ts

import type { ISymbolCharacs, Variable, AnchorX, AnchorY, IContainerSymbolCharacs } from "../core"
import { createBrandVariableFactory, type Width, type Height } from "../core"
import type { HintFactory } from "../dsl"

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
 * GridSymbol: Minimal interface required for grid symbols
 * Accepts any object with id and bounds properties
 */
type GridSymbol = Pick<ISymbolCharacs, "id" | "bounds">

/**
 * FluentGridBuilder provides a fluent API for grid-based layouts
 * Returns guide variables for grid lines and dimension variables for cell sizes
 */
export class FluentGridBuilder {
  private readonly symbols: (GridSymbol | null)[][]
  private readonly rows: number
  private readonly cols: number
  private readonly diagram: IContainerSymbolCharacs
  private container?: IContainerSymbolCharacs

  // Grid coordinate arrays - using AnchorX and AnchorY instead of GuideBuilder
  public readonly x: AnchorX[] = []
  public readonly y: AnchorY[] = []
  public readonly width: Width[] = []
  public readonly height: Height[] = []

  constructor(
    private readonly hint: HintFactory,
    symbols: (GridSymbol | null)[][],
    diagramContainer: IContainerSymbolCharacs
  ) {
    // Validate that symbols is a rectangular matrix
    if (symbols.length === 0) {
      throw new Error("FluentGridBuilder requires a non-empty matrix")
    }

    const firstRow = symbols[0]
    if (!firstRow || firstRow.length === 0) {
      throw new Error("FluentGridBuilder requires a non-empty matrix")
    }

    const firstRowLength = firstRow.length
    for (let i = 1; i < symbols.length; i++) {
      const row = symbols[i]
      if (!row || row.length !== firstRowLength) {
        throw new Error(
          "FluentGridBuilder requires a rectangular matrix. All rows must have the same number of columns."
        )
      }
    }

    this.symbols = symbols
    this.rows = symbols.length // N
    this.cols = firstRow.length // M
    this.diagram = diagramContainer
  }



  /**
   * Specify the container for this grid layout
   * @param container - The container symbol
   */
  in(container: IContainerSymbolCharacs): this {
    this.container = container
    this.applyLayout()
    return this
  }

  /**
   * Apply layout directly without specifying a container
   * Uses the diagram as the container
   */
  layout(): this {
    this.container = this.diagram
    this.applyLayout()
    return this
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

  /**
   * Apply the grid layout constraints
   */
  private applyLayout(): void {
    const context = this.hint.getLayoutContext()
    
    // Early validation: container must be set and valid
    if (!this.container) {
      throw new Error("FluentGridBuilder: container must be set before applying layout")
    }
    
    const containerTarget = this.hint.getConstraintTarget(this.container)
    if (!containerTarget || !containerTarget.container) {
      throw new Error(`FluentGridBuilder: container "${this.container.id}" not found or is not a container symbol`)
    }
    
    const containerBounds = containerTarget.container
    
    // Create branded variables for type safety
    // Width and Height types ensure that only dimension variables are used in dimension constraints
    const brandFactory = createBrandVariableFactory((id) => context.variables.createVariable(id))

    // Create all variables first
    // Create x guides (M+1 vertical lines) as AnchorX
    for (let i = 0; i <= this.cols; i++) {
      this.x.push(brandFactory.createAnchorX(`grid-x-${i}`))
    }

    // Create y guides (N+1 horizontal lines) as AnchorY
    for (let i = 0; i <= this.rows; i++) {
      this.y.push(brandFactory.createAnchorY(`grid-y-${i}`))
    }

    // Create width variables (M columns)
    for (let col = 0; col < this.cols; col++) {
      const widthVar = brandFactory.createWidth(`grid-width-${col}`)
      this.width.push(widthVar)
    }

    // Create height variables (N rows)
    for (let row = 0; row < this.rows; row++) {
      const heightVar = brandFactory.createHeight(`grid-height-${row}`)
      this.height.push(heightVar)
    }

    // Now create all constraints in a single createConstraint call
    context.createConstraint(`grid/layout`, (builder) => {
      // Width constraints: x[i+1] = x[i] + width[i] for all columns
      for (let col = 0; col < this.cols; col++) {
        const xNext = this.x[col + 1]
        const xCurr = this.x[col]
        const widthVar = this.width[col]
        if (xNext && xCurr && widthVar) {
          builder
            .ct([1, xNext])
            .eq([1, xCurr], [1, widthVar])
            .required()
        }
      }

      // Height constraints: y[i+1] = y[i] + height[i] for all rows
      for (let row = 0; row < this.rows; row++) {
        const yNext = this.y[row + 1]
        const yCurr = this.y[row]
        const heightVar = this.height[row]
        if (yNext && yCurr && heightVar) {
          builder
            .ct([1, yNext])
            .eq([1, yCurr], [1, heightVar])
            .required()
        }
      }

      // Container width = sum of all column widths
      const widthTerms: [number, Variable][] = this.width.map((w) => [1, w as Variable])
      builder.ct([1, containerBounds.width]).eq(...widthTerms).required()

      // Container height = sum of all row heights
      const heightTerms: [number, Variable][] = this.height.map((h) => [1, h as Variable])
      builder.ct([1, containerBounds.height]).eq(...heightTerms).required()

      // Align grid origin to container origin
      const x0 = this.x[0]
      const y0 = this.y[0]
      if (x0 && y0) {
        builder.ct([1, x0]).eq([1, containerBounds.x]).required()
        builder.ct([1, y0]).eq([1, containerBounds.y]).required()
      }
    })

    // Apply symbol-specific constraints
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const symbolRow = this.symbols[row]
        if (!symbolRow) continue
        
        const gridSymbol = symbolRow[col]
        if (!gridSymbol || gridSymbol === null) continue

        // gridSymbol is now always an object with id and bounds
        const symbolBounds = gridSymbol.bounds
        if (!symbolBounds) continue

        const yTop = this.y[row]
        const yBottom = this.y[row + 1]
        const xLeft = this.x[col]
        const xRight = this.x[col + 1]

        if (!yTop || !yBottom || !xLeft || !xRight) continue

        // Symbol bounds must be within the cell bounds
        // y[top] <= symbol.bounds.top; symbol.bounds.top <= y[bottom]
        // x[left] <= symbol.bounds.left; symbol.bounds.left <= x[right]
        // And align bottom and right
        const symbolId = gridSymbol.id
        
        // Create constraints to bound the symbol within its cell
        // Each constraint must be created separately with its own builder callback
        if (!symbolBounds || !symbolBounds.top || !symbolBounds.bottom || !symbolBounds.left || !symbolBounds.right) {
          console.warn(`Skipping symbol at ${row},${col} - invalid symbol bounds`)
          continue
        }
        
        // Create constraints to bound the symbol within its cell
        // All constraints for one symbol in a single createConstraint call
        context.createConstraint(`grid/symbol/${symbolId}/bounds`, (builder) => {
          // Top constraints: y[row] <= symbol.top <= y[row+1]
          builder.ct([1, symbolBounds.top]).ge([1, yTop]).medium()
          builder.ct([1, symbolBounds.top]).le([1, yBottom]).medium()

          // Left constraints: x[col] <= symbol.left <= x[col+1]
          builder.ct([1, symbolBounds.left]).ge([1, xLeft]).medium()
          builder.ct([1, symbolBounds.left]).le([1, xRight]).medium()

          // Bottom constraints: y[row] <= symbol.bottom <= y[row+1]
          builder.ct([1, symbolBounds.bottom]).ge([1, yTop]).medium()
          builder.ct([1, symbolBounds.bottom]).le([1, yBottom]).medium()

          // Right constraints: x[col] <= symbol.right <= x[col+1]
          builder.ct([1, symbolBounds.right]).ge([1, xLeft]).medium()
          builder.ct([1, symbolBounds.right]).le([1, xRight]).medium()
        })
        
        // Ensure the cell is at least as large as the symbol
        const cellWidth = this.width[col]
        const cellHeight = this.height[row]
        if (cellWidth && cellHeight) {
          context.createConstraint(`grid/cell/${row}/${col}/size`, (builder) => {
            // Cell width >= symbol width
            builder.ct([1, cellWidth]).ge([1, symbolBounds.width]).strong()
            // Cell height >= symbol height
            builder.ct([1, cellHeight]).ge([1, symbolBounds.height]).strong()
          })
        }
      }
    }
  }
}
