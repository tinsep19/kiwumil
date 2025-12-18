// src/hint/fluent_grid_builder.ts

import type { SymbolId, ISymbolCharacs, Variable, AnchorX, AnchorY } from "../core"
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
 * Accepts any object with id and bounds properties, or just a SymbolId
 */
type GridSymbol = Pick<ISymbolCharacs, "id" | "bounds"> | SymbolId

/**
 * FluentGridBuilder provides a fluent API for grid-based layouts
 * Returns guide variables for grid lines and dimension variables for cell sizes
 */
export class FluentGridBuilder {
  private readonly symbols: (GridSymbol | null)[][]
  private readonly rows: number
  private readonly cols: number
  private container?: SymbolId

  // Grid coordinate arrays - using AnchorX and AnchorY instead of GuideBuilder
  public readonly x: AnchorX[] = []
  public readonly y: AnchorY[] = []
  public readonly width: Width[] = []
  public readonly height: Height[] = []

  constructor(
    private readonly hint: HintFactory,
    symbols: (GridSymbol | null)[][]
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

    // Initialize grid coordinates and dimensions
    this.initializeGrid()
  }

  /**
   * Initialize grid coordinate system
   * Creates M+1 x guides, N+1 y guides, M width variables, and N height variables
   */
  private initializeGrid(): void {
    const context = this.hint.getLayoutContext()

    // Create branded variables for type safety
    // Width and Height types ensure that only dimension variables are used in dimension constraints
    const brandFactory = createBrandVariableFactory((id) => context.variables.createVariable(id))

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

      // Constraint: x[i+1] = x[i] + width[i]
      context.createConstraint(`grid/width/${col}`, (builder) => {
        const xNext = this.x[col + 1]
        const xCurr = this.x[col]
        if (xNext && xCurr) {
          builder.expr([1, xNext]).eq([1, xCurr], [1, widthVar]).required()
        }
      })
    }

    // Create height variables (N rows)
    for (let row = 0; row < this.rows; row++) {
      const heightVar = brandFactory.createHeight(`grid-height-${row}`)
      this.height.push(heightVar)

      // Constraint: y[i+1] = y[i] + height[i]
      context.createConstraint(`grid/height/${row}`, (builder) => {
        const yNext = this.y[row + 1]
        const yCurr = this.y[row]
        if (yNext && yCurr) {
          builder.expr([1, yNext]).eq([1, yCurr], [1, heightVar]).required()
        }
      })
    }
  }

  /**
   * Specify the container for this grid layout
   * @param container - The container symbol ID
   */
  in(container: SymbolId): this {
    this.container = container
    this.applyLayout()
    return this
  }

  /**
   * Apply layout directly without specifying a container
   * Uses the diagram as the container
   */
  layout(): this {
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
      throw new Error(
        `Invalid row indices: top=${top}, bottom=${bottom}. Must be in [0, ${this.rows}]`
      )
    }
    if (left < 0 || left > this.cols || right < 0 || right > this.cols) {
      throw new Error(
        `Invalid column indices: left=${left}, right=${right}. Must be in [0, ${this.cols}]`
      )
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

    // If container is specified, constrain grid bounds to container
    if (this.container) {
      const containerTarget = this.hint.getConstraintTarget(this.container)
      if (containerTarget && containerTarget.container) {
        const containerBounds = containerTarget.container

        // Container width = sum of all column widths
        context.createConstraint(`grid/container-width`, (builder) => {
          const widthTerms: [number, Variable][] = this.width.map((w) => [1, w as Variable])
          builder
            .expr([1, containerBounds.width])
            .eq(...widthTerms)
            .required()
        })

        // Container height = sum of all row heights
        context.createConstraint(`grid/container-height`, (builder) => {
          const heightTerms: [number, Variable][] = this.height.map((h) => [1, h as Variable])
          builder
            .expr([1, containerBounds.height])
            .eq(...heightTerms)
            .required()
        })

        // Align grid origin to container origin
        context.createConstraint(`grid/container-origin`, (builder) => {
          const x0 = this.x[0]
          const y0 = this.y[0]
          if (x0 && y0) {
            builder.expr([1, x0]).eq([1, containerBounds.x]).required()
            builder.expr([1, y0]).eq([1, containerBounds.y]).required()
          }
        })
      }
    }

    // Apply symbol-specific constraints
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const symbolRow = this.symbols[row]
        if (!symbolRow) continue

        const gridSymbol = symbolRow[col]
        if (!gridSymbol || gridSymbol === null) continue

        // Resolve SymbolId to actual symbol if needed
        const symbol =
          typeof gridSymbol === "string" ? this.hint.getConstraintTarget(gridSymbol) : gridSymbol

        if (!symbol || !symbol.bounds) continue

        const symbolBounds = symbol.bounds

        const yTop = this.y[row]
        const yBottom = this.y[row + 1]
        const xLeft = this.x[col]
        const xRight = this.x[col + 1]

        if (!yTop || !yBottom || !xLeft || !xRight) continue

        // Symbol bounds must be within the cell bounds
        // y[top] <= symbol.bounds.top; symbol.bounds.top <= y[bottom]
        // x[left] <= symbol.bounds.left; symbol.bounds.left <= x[right]
        // And align bottom and right
        let symbolId: string
        if (typeof gridSymbol === "string") {
          symbolId = gridSymbol
        } else if ("id" in symbol && symbol.id) {
          symbolId = symbol.id as string
        } else if ("boundId" in symbol) {
          symbolId = symbol.boundId as string
        } else {
          // Fallback
          symbolId = `grid-symbol-${row}-${col}`
        }

        // Create constraints to bound the symbol within its cell
        // Each constraint must be created separately with its own builder callback
        if (
          !symbolBounds ||
          !symbolBounds.top ||
          !symbolBounds.bottom ||
          !symbolBounds.left ||
          !symbolBounds.right
        ) {
          console.warn(`Skipping symbol at ${row},${col} - invalid symbol bounds`)
          continue
        }

        // Create constraints to bound the symbol within its cell
        // All constraints for one symbol in a single createConstraint call
        context.createConstraint(`grid/symbol/${symbolId}/bounds`, (builder) => {
          // Top constraints: y[row] <= symbol.top <= y[row+1]
          builder.expr([1, symbolBounds.top]).ge([1, yTop]).medium()
          builder.expr([1, symbolBounds.top]).le([1, yBottom]).medium()

          // Left constraints: x[col] <= symbol.left <= x[col+1]
          builder.expr([1, symbolBounds.left]).ge([1, xLeft]).medium()
          builder.expr([1, symbolBounds.left]).le([1, xRight]).medium()

          // Bottom constraints: y[row] <= symbol.bottom <= y[row+1]
          builder.expr([1, symbolBounds.bottom]).ge([1, yTop]).medium()
          builder.expr([1, symbolBounds.bottom]).le([1, yBottom]).medium()

          // Right constraints: x[col] <= symbol.right <= x[col+1]
          builder.expr([1, symbolBounds.right]).ge([1, xLeft]).medium()
          builder.expr([1, symbolBounds.right]).le([1, xRight]).medium()
        })
      }
    }
  }
}
