// src/dsl/hint_factory.ts
import { SymbolBase, Symbols, LayoutContext, type ContainerSymbol } from "../model"
import type { SymbolId, HintTarget, ISymbolCharacs } from "../core"
import {
  FigureBuilder,
  GridBuilder,
  FluentGridBuilder,
  GuideBuilderImpl,
  type GuideBuilderX,
  type GuideBuilderY,
} from "../hint"
import { ContainerSymbolOrId, toSymbolId, type SymbolOrId } from "./symbol_helpers"

type LayoutTargetId = SymbolOrId
type LayoutContainerTarget = ContainerSymbolOrId

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
 * - Arrangement constraints (horizontal, vertical)
 * - Guide-based layouts with custom anchors
 * - Container enclosure relationships
 * 
 * @example
 * ```typescript
 * const hint = new HintFactory({ context, symbols, diagramContainer });
 * 
 * // Align symbols
 * hint.alignLeft(symbol1, symbol2);
 * 
 * // Create grid layout
 * hint.grid([[symbol1, symbol2], [symbol3, symbol4]]).layout();
 * 
 * // Create guides
 * const guideX = hint.createGuideX(100);
 * guideX.alignLeft(symbol1, symbol2);
 * ```
 */
export class HintFactory {
  private guideCounter = 0
  private readonly diagramContainer: SymbolId
  private readonly context: LayoutContext
  private readonly symbols: Symbols

  /**
   * Creates a new HintFactory instance.
   * 
   * @param params - Configuration object
   * @param params.context - The layout context containing solver and theme
   * @param params.symbols - The symbols registry for resolving symbol references
   * @param params.diagramContainer - The ID of the root diagram container
   */
  constructor({
    context,
    symbols,
    diagramContainer,
  }: {
    context: LayoutContext
    symbols: Symbols
    diagramContainer: SymbolId
  }) {
    this.context = context
    this.symbols = symbols
    this.diagramContainer = diagramContainer
  }

  // ============================================================================
  // Builder Creation Methods
  // ============================================================================

  /**
   * Creates a grid layout builder for rectangular matrix layouts.
   * 
   * This method has two overloads:
   * 1. Fluent Grid API - Pass a 2D array of symbols directly
   * 2. Traditional Grid API - Pass a container (or omit for diagram-level grid)
   * 
   * @param symbolsOrContainer - Either a 2D array of symbols for fluent grid, 
   *                             or a container ID for traditional grid
   * @returns FluentGridBuilder for 2D array input, GridBuilder otherwise
   * 
   * @example
   * ```typescript
   * // Fluent grid API
   * hint.grid([[sym1, sym2], [sym3, sym4]]).layout();
   * 
   * // Traditional grid API
   * hint.grid(container).enclose([[sym1, sym2]]).layout();
   * ```
   */
  grid(
    symbolsOrContainer?: LayoutContainerTarget | (Pick<ISymbolCharacs, "id" | "bounds"> | SymbolId | null)[][]
  ): GridBuilder | FluentGridBuilder {
    if (Array.isArray(symbolsOrContainer)) {
      return new FluentGridBuilder(this, symbolsOrContainer, this.diagramContainer)
    }
    
    const targetContainer = symbolsOrContainer ? toSymbolId(symbolsOrContainer) : this.diagramContainer
    return new GridBuilder(this, targetContainer)
  }

  /**
   * Creates a figure layout builder for non-rectangular layouts.
   * 
   * Figure layouts support rows with different numbers of elements,
   * unlike grid layouts which require rectangular matrices.
   * 
   * @param container - Container ID. If omitted, uses the diagram container
   * @returns FigureBuilder instance for configuring the layout
   * 
   * @example
   * ```typescript
   * hint.figure(container)
   *   .enclose([[sym1], [sym2, sym3]])
   *   .align('center')
   *   .gap(20)
   *   .layout();
   * ```
   */
  figure(container?: LayoutContainerTarget): FigureBuilder {
    const targetContainer = container ? toSymbolId(container) : this.diagramContainer
    return new FigureBuilder(this, targetContainer)
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
   * const guide = hint.createGuideX(100);
   * guide.alignLeft(sym1, sym2, sym3);
   * ```
   */
  createGuideX(value?: number): GuideBuilderX {
    return new GuideBuilderImpl(
      this.context,
      (id: LayoutTargetId) => this.findSymbolById(id),
      (id: LayoutTargetId) => this.resolveConstraintTarget(id),
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
   * const guide = hint.createGuideY(50);
   * guide.alignTop(sym1, sym2, sym3);
   * ```
   */
  createGuideY(value?: number): GuideBuilderY {
    return new GuideBuilderImpl(
      this.context,
      (id: LayoutTargetId) => this.findSymbolById(id),
      (id: LayoutTargetId) => this.resolveConstraintTarget(id),
      "y",
      `guideY-${this.guideCounter++}`,
      value
    )
  }

  // ============================================================================
  // Arrangement Methods
  // ============================================================================

  /**
   * Arranges symbols horizontally with equal spacing.
   * Alias for arrangeHorizontal for backward compatibility.
   * 
   * @param symbolIds - Symbols to arrange from left to right
   * 
   * @example
   * ```typescript
   * hint.horizontal(sym1, sym2, sym3);
   * ```
   */
  horizontal(...symbolIds: LayoutTargetId[]): void {
    this.arrangeHorizontal(...symbolIds)
  }

  /**
   * Arranges symbols vertically with equal spacing.
   * Alias for arrangeVertical for backward compatibility.
   * 
   * @param symbolIds - Symbols to arrange from top to bottom
   * 
   * @example
   * ```typescript
   * hint.vertical(sym1, sym2, sym3);
   * ```
   */
  vertical(...symbolIds: LayoutTargetId[]): void {
    this.arrangeVertical(...symbolIds)
  }

  /**
   * Arranges symbols horizontally from left to right with equal spacing.
   * 
   * This creates constraints that ensure symbols are positioned horizontally
   * with consistent gaps between them, using the theme's default horizontal gap.
   * 
   * @param symbolIds - Symbols to arrange
   * 
   * @example
   * ```typescript
   * hint.arrangeHorizontal(sym1, sym2, sym3);
   * // Results in: [sym1] -- gap -- [sym2] -- gap -- [sym3]
   * ```
   */
  arrangeHorizontal(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.arrangeHorizontal(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Arranges symbols vertically from top to bottom with equal spacing.
   * 
   * This creates constraints that ensure symbols are positioned vertically
   * with consistent gaps between them, using the theme's default vertical gap.
   * 
   * @param symbolIds - Symbols to arrange
   * 
   * @example
   * ```typescript
   * hint.arrangeVertical(sym1, sym2, sym3);
   * // Results in: [sym1]
   * //             gap
   * //             [sym2]
   * //             gap
   * //             [sym3]
   * ```
   */
  arrangeVertical(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.arrangeVertical(this.resolveConstraintTargets(symbolIds))
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
   * 
   * @example
   * ```typescript
   * hint.alignLeft(sym1, sym2, sym3);
   * ```
   */
  alignLeft(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignLeft(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Aligns the right edges of the specified symbols.
   * 
   * All symbols will have their right edges (x + width) aligned to the same position.
   * 
   * @param symbolIds - Symbols to align
   * 
   * @example
   * ```typescript
   * hint.alignRight(sym1, sym2, sym3);
   * ```
   */
  alignRight(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignRight(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Aligns the top edges of the specified symbols.
   * 
   * All symbols will have their top edges (y coordinate) aligned to the same position.
   * 
   * @param symbolIds - Symbols to align
   * 
   * @example
   * ```typescript
   * hint.alignTop(sym1, sym2, sym3);
   * ```
   */
  alignTop(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignTop(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Aligns the bottom edges of the specified symbols.
   * 
   * All symbols will have their bottom edges (y + height) aligned to the same position.
   * 
   * @param symbolIds - Symbols to align
   * 
   * @example
   * ```typescript
   * hint.alignBottom(sym1, sym2, sym3);
   * ```
   */
  alignBottom(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignBottom(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Aligns the horizontal center points of the specified symbols.
   * 
   * All symbols will have their horizontal centers (x + width/2) aligned.
   * 
   * @param symbolIds - Symbols to align
   * 
   * @example
   * ```typescript
   * hint.alignCenterX(sym1, sym2, sym3);
   * ```
   */
  alignCenterX(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignCenterX(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Aligns the vertical center points of the specified symbols.
   * 
   * All symbols will have their vertical centers (y + height/2) aligned.
   * 
   * @param symbolIds - Symbols to align
   * 
   * @example
   * ```typescript
   * hint.alignCenterY(sym1, sym2, sym3);
   * ```
   */
  alignCenterY(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignCenterY(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Makes all specified symbols have the same width.
   * 
   * @param symbolIds - Symbols to make equal width
   * 
   * @example
   * ```typescript
   * hint.alignWidth(sym1, sym2, sym3);
   * ```
   */
  alignWidth(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignWidth(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Makes all specified symbols have the same height.
   * 
   * @param symbolIds - Symbols to make equal height
   * 
   * @example
   * ```typescript
   * hint.alignHeight(sym1, sym2, sym3);
   * ```
   */
  alignHeight(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignHeight(this.resolveConstraintTargets(symbolIds))
  }

  /**
   * Makes all specified symbols have the same width and height.
   * 
   * This is equivalent to calling both alignWidth and alignHeight.
   * 
   * @param symbolIds - Symbols to make equal size
   * 
   * @example
   * ```typescript
   * hint.alignSize(sym1, sym2, sym3);
   * ```
   */
  alignSize(...symbolIds: LayoutTargetId[]): void {
    this.context.hints.alignSize(this.resolveConstraintTargets(symbolIds))
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
   * 
   * @remarks
   * Z-depth constraints should be handled by hints.enclose() implementation
   * with layout.z constraints, not through nestLevel mutations.
   * 
   * @example
   * ```typescript
   * hint.enclose(systemBoundary, [usecase1, usecase2, usecase3]);
   * ```
   */
  enclose(container: LayoutContainerTarget, childIds: LayoutTargetId[]): void {
    const containerId = toSymbolId(container)
    const containerTarget = this.resolveConstraintTarget(containerId)
    if (!containerTarget) {
      return
    }

    const childTargets = this.resolveConstraintTargets(childIds)
    this.context.hints.enclose(containerTarget, childTargets)
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
  resolveConstraintTargets(targets: LayoutTargetId[]): HintTarget[] {
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
  getConstraintTarget(target: LayoutTargetId): HintTarget | undefined {
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
  private resolveConstraintTarget(target: LayoutTargetId): HintTarget | undefined {
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
  private findSymbolById(id: LayoutTargetId): SymbolBase | undefined {
    return this.symbols.findSymbolById(toSymbolId(id))
  }
}
