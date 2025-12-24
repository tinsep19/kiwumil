// src/dsl/hint_factory.ts
import { SymbolBase, Symbols, LayoutContext, type ContainerSymbol } from "../model"
import type { HintTarget, ISymbolCharacs, IContainerSymbolCharacs } from "../core"
import {
  FluentGridBuilder,
  FluentArrangeBuilder,
  GuideBuilderImpl,
  type GuideBuilderX,
  type GuideBuilderY,
} from "../hint"
import { toSymbolId } from "./symbol_helpers"

type LayoutTarget = ISymbolCharacs
type LayoutContainerTarget = IContainerSymbolCharacs

/**
 * HintFactory provides a high-level API for creating layout hints and constraints.
 * 
 * This factory class serves as the main entry point for users to specify layout intentions
 * through builders (Grid, Figure, Guide) and direct alignment/arrangement methods.
 * 
 * @remarks
 * HintFactory works with the underlying LayoutContext and Symbols to convert user-friendly
 * layout specifications into constraint solver primitives. It supports:
 * - Grid and figure-based layouts
 * - Alignment constraints (left, right, top, bottom, center, size)
 * - Arrangement constraints (horizontal, vertical) with fluent API
 * - Guide-based layouts with custom anchors
 * - Container enclosure relationships
 * 
 * @example
 * ```typescript
 * const hint = new HintFactory({ context, symbols, diagramContainer });
 * 
 * // Fluent API - Align symbols
 * hint.alignLeft(symbol1, symbol2).arrangeVertical(symbol1, symbol2);
 * 
 * // Fluent API - Arrange with margin
 * hint.arrange(symbol1, symbol2, symbol3).margin(30).vertical();
 * 
 * // Create grid layout
 * hint.grid([[symbol1, symbol2], [symbol3, symbol4]]).layout();
 * 
 * // Create guides
 * const guideX = hint.guideX(100);
 * guideX.alignLeft(symbol1, symbol2);
 * ```
 */
export class HintFactory {
  private guideCounter = 0
  private readonly diagramContainer: IContainerSymbolCharacs
  private readonly context: LayoutContext
  private readonly symbols: Symbols

  /**
   * Creates a new HintFactory instance.
   * 
   * @param params - Configuration object
   * @param params.context - The layout context containing solver and theme
   * @param params.symbols - The symbols registry for resolving symbol references
   * @param params.diagramContainer - The container characteristics of the root diagram container
   */
  constructor({
    context,
    symbols,
    diagramContainer,
  }: {
    context: LayoutContext
    symbols: Symbols
    diagramContainer: IContainerSymbolCharacs
  }) {
    this.context = context
    this.symbols = symbols
    this.diagramContainer = diagramContainer
  }

  // ============================================================================
  // Builder Creation Methods
  // ============================================================================

  /**
   * Creates a fluent grid layout builder for rectangular matrix layouts.
   * 
   * This method creates a grid layout by accepting a 2D array of symbols.
   * The grid automatically creates guide variables for rows and columns,
   * and provides methods to access grid coordinates and areas.
   * 
   * @param symbols - 2D array of symbols (rectangular matrix required)
   * @returns FluentGridBuilder with grid coordinate system
   * 
   * @example
   * ```typescript
   * // Create a 2x2 grid
   * const grid = hint.grid([
   *   [sym1, sym2],
   *   [sym3, sym4]
   * ]).layout();
   * 
   * // Access grid coordinates
   * const grid = hint.grid([[sym1, sym2], [sym3, sym4]]);
   * grid.layout();
   * // grid.x[0], grid.x[1], grid.x[2] - vertical guides
   * // grid.y[0], grid.y[1], grid.y[2] - horizontal guides
   * // grid.width[0], grid.width[1] - column widths
   * // grid.height[0], grid.height[1] - row heights
   * ```
   */
  grid(
    symbols: (Pick<ISymbolCharacs, "id" | "bounds"> | null)[][]
  ): FluentGridBuilder {
    return new FluentGridBuilder(this, symbols, this.diagramContainer)
  }

  /**
   * Creates a horizontal guide builder at the specified X coordinate.
   * 
   * Guide builders allow aligning multiple symbols to a common anchor point
   * or following the position of another symbol.
   * 
   * @param value - Optional initial X coordinate value
   * @returns GuideBuilderX instance for X-axis alignment operations
   * 
   * @example
   * ```typescript
   * const guide = hint.guideX(100);
   * guide.alignLeft(sym1, sym2, sym3);
   * 
   * // Without initial value
   * const guide2 = hint.guideX();
   * guide2.followLeft(sym1).alignLeft(sym2, sym3);
   * ```
   */
  guideX(value?: number): GuideBuilderX {
    return new GuideBuilderImpl(
      this.context,
      this.findSymbolById.bind(this),
      this.resolveConstraintTarget.bind(this),
      "x",
      `guideX-${this.guideCounter++}`,
      value
    )
  }

  /**
   * Creates a vertical guide builder at the specified Y coordinate.
   * 
   * Guide builders allow aligning multiple symbols to a common anchor point
   * or following the position of another symbol.
   * 
   * @param value - Optional initial Y coordinate value
   * @returns GuideBuilderY instance for Y-axis alignment operations
   * 
   * @example
   * ```typescript
   * const guide = hint.guideY(50);
   * guide.alignTop(sym1, sym2, sym3);
   * 
   * // Without initial value
   * const guide2 = hint.guideY();
   * guide2.followTop(sym1).alignTop(sym2, sym3);
   * ```
   */
  guideY(value?: number): GuideBuilderY {
    return new GuideBuilderImpl(
      this.context,
      this.findSymbolById.bind(this),
      this.resolveConstraintTarget.bind(this),
      "y",
      `guideY-${this.guideCounter++}`,
      value
    )
  }

  // ============================================================================
  // Arrangement Methods
  // ============================================================================

  /**
   * Creates a fluent arrangement builder for organizing symbols.
   * 
   * This method returns a builder that allows specifying:
   * - Symbols to arrange (passed as arguments)
   * - Optional margin/gap via `.margin(value)`
   * - Direction via `.vertical()` or `.horizontal()`
   * 
   * @param symbolIds - Symbols to arrange
   * @returns FluentArrangeBuilder for method chaining
   * 
   * @example
   * ```typescript
   * // Basic vertical arrangement
   * hint.arrange(sym1, sym2, sym3).vertical();
   * 
   * // With custom margin
   * hint.arrange(sym1, sym2, sym3).margin(20).vertical();
   * 
   * // Horizontal arrangement
   * hint.arrange(sym1, sym2, sym3).horizontal();
   * ```
   */
  arrange(...symbolIds: LayoutTarget[]): FluentArrangeBuilder {
    return new FluentArrangeBuilder(
      this.context,
      (targets) => this.resolveConstraintTargets(targets),
      symbolIds
    )
  }

  /**
   * Arranges symbols horizontally with equal spacing.
   * Alias for arrangeHorizontal for backward compatibility.
   * 
   * @param symbolIds - Symbols to arrange from left to right
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.horizontal(sym1, sym2, sym3).alignTop(sym1, sym2, sym3);
   * ```
   */
  horizontal(...symbolIds: LayoutTarget[]): this {
    this.arrangeHorizontal(...symbolIds)
    return this
  }

  /**
   * Arranges symbols vertically with equal spacing.
   * Alias for arrangeVertical for backward compatibility.
   * 
   * @param symbolIds - Symbols to arrange from top to bottom
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.vertical(sym1, sym2, sym3).alignLeft(sym1, sym2, sym3);
   * ```
   */
  vertical(...symbolIds: LayoutTarget[]): this {
    this.arrangeVertical(...symbolIds)
    return this
  }

  /**
   * Arranges symbols horizontally from left to right with equal spacing.
   * 
   * This creates constraints that ensure symbols are positioned horizontally
   * with consistent gaps between them, using the theme's default horizontal gap.
   * 
   * @param symbolIds - Symbols to arrange
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.arrangeHorizontal(sym1, sym2, sym3).alignTop(sym1, sym2, sym3);
   * // Results in: [sym1] -- gap -- [sym2] -- gap -- [sym3]
   * ```
   */
  arrangeHorizontal(...symbolIds: LayoutTarget[]): this {
    this.context.hints.arrangeHorizontal(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Arranges symbols vertically from top to bottom with equal spacing.
   * 
   * This creates constraints that ensure symbols are positioned vertically
   * with consistent gaps between them, using the theme's default vertical gap.
   * 
   * @param symbolIds - Symbols to arrange
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.arrangeVertical(sym1, sym2, sym3).alignLeft(sym1, sym2, sym3);
   * // Results in: [sym1]
   * //             gap
   * //             [sym2]
   * //             gap
   * //             [sym3]
   * ```
   */
  arrangeVertical(...symbolIds: LayoutTarget[]): this {
    this.context.hints.arrangeVertical(this.resolveConstraintTargets(symbolIds))
    return this
  }

  // ============================================================================
  // Alignment Methods
  // ============================================================================

  /**
   * Aligns the left edges of the specified symbols.
   * 
   * All symbols will have their left edges (x coordinate) aligned to the same position.
   * 
   * @param symbolIds - Symbols to align
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignLeft(sym1, sym2, sym3).arrangeVertical(sym1, sym2, sym3);
   * ```
   */
  alignLeft(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignLeft(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Aligns the right edges of the specified symbols.
   * 
   * All symbols will have their right edges (x + width) aligned to the same position.
   * 
   * @param symbolIds - Symbols to align
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignRight(sym1, sym2, sym3).arrangeVertical(sym1, sym2, sym3);
   * ```
   */
  alignRight(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignRight(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Aligns the top edges of the specified symbols.
   * 
   * All symbols will have their top edges (y coordinate) aligned to the same position.
   * 
   * @param symbolIds - Symbols to align
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignTop(sym1, sym2, sym3).arrangeHorizontal(sym1, sym2, sym3);
   * ```
   */
  alignTop(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignTop(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Aligns the bottom edges of the specified symbols.
   * 
   * All symbols will have their bottom edges (y + height) aligned to the same position.
   * 
   * @param symbolIds - Symbols to align
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignBottom(sym1, sym2, sym3).arrangeHorizontal(sym1, sym2, sym3);
   * ```
   */
  alignBottom(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignBottom(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Aligns the horizontal center points of the specified symbols.
   * 
   * All symbols will have their horizontal centers (x + width/2) aligned.
   * 
   * @param symbolIds - Symbols to align
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignCenterX(sym1, sym2, sym3).arrangeVertical(sym1, sym2, sym3);
   * ```
   */
  alignCenterX(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignCenterX(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Aligns the vertical center points of the specified symbols.
   * 
   * All symbols will have their vertical centers (y + height/2) aligned.
   * 
   * @param symbolIds - Symbols to align
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignCenterY(sym1, sym2, sym3).arrangeHorizontal(sym1, sym2, sym3);
   * ```
   */
  alignCenterY(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignCenterY(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Makes all specified symbols have the same width.
   * 
   * @param symbolIds - Symbols to make equal width
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignWidth(sym1, sym2, sym3).alignCenterX(sym1, sym2, sym3);
   * ```
   */
  alignWidth(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignWidth(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Makes all specified symbols have the same height.
   * 
   * @param symbolIds - Symbols to make equal height
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignHeight(sym1, sym2, sym3).alignCenterY(sym1, sym2, sym3);
   * ```
   */
  alignHeight(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignHeight(this.resolveConstraintTargets(symbolIds))
    return this
  }

  /**
   * Makes all specified symbols have the same width and height.
   * 
   * This is equivalent to calling both alignWidth and alignHeight.
   * 
   * @param symbolIds - Symbols to make equal size
   * @returns This HintFactory instance for method chaining
   * 
   * @example
   * ```typescript
   * hint.alignSize(sym1, sym2, sym3).alignCenterX(sym1, sym2, sym3);
   * ```
   */
  alignSize(...symbolIds: LayoutTarget[]): this {
    this.context.hints.alignSize(this.resolveConstraintTargets(symbolIds))
    return this
  }

  // ============================================================================
  // Container Enclosure Methods
  // ============================================================================

  /**
   * Creates a container-child relationship where the container bounds enclose the children.
   * 
   * This method establishes layout constraints that ensure:
   * 1. The container is large enough to contain all child elements
   * 2. Children are positioned within the container's bounds
   * 3. Proper z-ordering (depth) relationships are maintained
   * 
   * @param container - The container symbol that will enclose the children
   * @param childIds - Array of child symbols to be enclosed
   * @returns This HintFactory instance for method chaining
   * 
   * @remarks
   * Z-depth constraints should be handled by hints.enclose() implementation
   * with layout.z constraints, not through nestLevel mutations.
   * 
   * @example
   * ```typescript
   * hint.enclose(systemBoundary, [usecase1, usecase2, usecase3])
   *     .alignCenterX(usecase1, usecase2, usecase3);
   * ```
   */
  enclose(container: LayoutContainerTarget, childIds: LayoutTarget[]): this {
    const containerTarget = this.resolveConstraintTarget(container)
    if (!containerTarget) {
      return this
    }

    const childTargets = this.resolveConstraintTargets(childIds)
    this.context.hints.enclose(containerTarget, childTargets)
    return this
  }

  // ============================================================================
  // Public Access Methods (for Builders)
  // ============================================================================

  /**
   * Gets the layout context.
   * 
   * This method provides builders access to the underlying layout context
   * for creating constraints and accessing solver functionality.
   * 
   * @returns The LayoutContext instance
   * 
   * @remarks
   * This method is primarily used by builder classes and should not be
   * called directly by end users in most cases.
   */
  getLayoutContext(): LayoutContext {
    return this.context
  }

  /**
   * Gets all registered symbols.
   * 
   * This method provides builders access to the complete symbol registry
   * for iteration and lookup operations.
   * 
   * @returns Read-only array of all symbols
   * 
   * @remarks
   * This method is primarily used by builder classes and should not be
   * called directly by end users in most cases.
   */
  getSymbols(): readonly SymbolBase[] {
    return this.symbols.getAllSymbols()
  }

  /**
   * Resolves multiple layout targets to their constraint representation.
   * 
   * This method converts symbol IDs or symbol objects into HintTarget objects
   * that can be used with the constraint system. Invalid targets are filtered out.
   * 
   * @param targets - Array of symbol IDs or symbol objects
   * @returns Array of resolved HintTarget objects
   * 
   * @remarks
   * This method is primarily used by builder classes and internal methods.
   */
  resolveConstraintTargets(targets: LayoutTarget[]): HintTarget[] {
    return targets
      .map((target) => this.resolveConstraintTarget(target))
      .filter((target): target is HintTarget => Boolean(target))
  }

  /**
   * Gets the constraint target for a single layout target.
   * 
   * This is a public accessor that delegates to the private resolution method.
   * 
   * @param target - Symbol ID or symbol object
   * @returns HintTarget if found, undefined otherwise
   * 
   * @remarks
   * This method is primarily used by builder classes.
   */
  getConstraintTarget(target: LayoutTarget): HintTarget | undefined {
    return this.resolveConstraintTarget(target)
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Resolves a single layout target to its constraint representation.
   * 
   * This private method handles the conversion of symbol IDs or symbol objects
   * into HintTarget objects. It looks up the symbol, extracts its bounds,
   * and determines if it's a container symbol.
   * 
   * @param target - Symbol ID or symbol object to resolve
   * @returns HintTarget if symbol is found, undefined otherwise
   */
  private resolveConstraintTarget(target: LayoutTarget): HintTarget | undefined {
    const symbol = this.findSymbolById(target)
    if (!symbol) {
      return undefined
    }

    const container = this.isContainerSymbol(symbol) ? symbol.container : undefined
    return {
      boundId: symbol.bounds.boundId,
      bounds: symbol.bounds,
      container,
    }
  }

  /**
   * Type guard to check if a symbol is a container symbol.
   * 
   * Container symbols have an additional `container` property with container-specific
   * bounds and constraints.
   * 
   * @param symbol - Symbol to check
   * @returns True if the symbol is a container symbol
   */
  private isContainerSymbol(symbol: SymbolBase): symbol is ContainerSymbol {
    return typeof (symbol as ContainerSymbol).container === "object"
  }

  /**
   * Finds a symbol by its ID.
   * 
   * This helper method normalizes the input (converting symbol objects to IDs)
   * and looks up the symbol in the symbols registry.
   * 
   * @param id - Symbol ID or symbol object
   * @returns Symbol if found, undefined otherwise
   */
  private findSymbolById(id: LayoutTarget): SymbolBase | undefined {
    return this.symbols.findSymbolById(toSymbolId(id))
  }
}
