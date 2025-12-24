// src/core/layout_hint.ts
// HintTarget interface definition and DSL builder interfaces

import type { BoundId } from "./types"
import type { LayoutBounds, ContainerBounds } from "./bounds"

/**
 * HintTarget: 制約適用の対象となるシンボルの境界情報
 */
export interface HintTarget {
  readonly boundId: BoundId
  readonly bounds: LayoutBounds
  readonly container?: ContainerBounds
}

// ============================================================================
// TypeScript Utility Types for Field Selection
// ============================================================================

/**
 * MinimalTarget: Extract only boundId and bounds from HintTarget
 * Useful for operations that don't need container information
 */
export type MinimalTarget = Pick<HintTarget, "boundId" | "bounds">

/**
 * TargetWithContainer: Require container field to be present
 * Used for nested layout operations that must have a parent container
 */
export type TargetWithContainer = Required<HintTarget>

/**
 * BoundsOnlyTarget: Target without boundId
 * For operations focused purely on spatial relationships
 */
export type BoundsOnlyTarget = Omit<HintTarget, "boundId">

// ============================================================================
// Fluent DSL Builder Interfaces
// ============================================================================

/**
 * ArrangeBuilder: Fluent interface for arranging elements sequentially
 * 
 * Provides methods to specify arrangement direction (x or y axis) followed by
 * optional gap configuration and container finalization.
 * 
 * @example
 * ```typescript
 * hint.arrange(targets)
 *   .x()              // Arrange horizontally
 *   .gap(30)          // 30px spacing
 *   .in(container)    // Finalize in container
 * ```
 */
export interface ArrangeBuilder {
  /**
   * Arrange elements along X axis (horizontal)
   * @returns ArrangeAxisBuilder for further configuration
   */
  x(): ArrangeAxisBuilder

  /**
   * Arrange elements along Y axis (vertical)
   * @returns ArrangeAxisBuilder for further configuration
   */
  y(): ArrangeAxisBuilder
}

/**
 * ArrangeAxisBuilder: Configuration interface after axis selection
 * 
 * Allows setting gap spacing and finalizing the arrangement within a container.
 */
export interface ArrangeAxisBuilder {
  /**
   * Set gap between consecutive elements
   * @param space - Distance between elements in pixels
   * @returns This builder for method chaining
   */
  gap(space: number): this

  /**
   * Finalize arrangement within specified container
   * @param container - Container bounds to arrange within
   */
  in(container: ContainerBounds): void
}

/**
 * FlowBuilder: Fluent interface for flowing layouts with wrapping
 * 
 * Similar to CSS flexbox, allows elements to flow along a primary axis and
 * wrap to the next line/column when reaching a threshold.
 * 
 * @example
 * ```typescript
 * hint.flow(targets)
 *   .horizontal()     // Flow left-to-right
 *   .wrap(400)        // Wrap at 400px
 *   .gap(10)          // 10px spacing
 *   .in(container)    // Finalize
 * ```
 */
export interface FlowBuilder {
  /**
   * Set primary flow direction to horizontal
   * @returns FlowDirectionBuilder for further configuration
   */
  horizontal(): FlowDirectionBuilder

  /**
   * Set primary flow direction to vertical
   * @returns FlowDirectionBuilder for further configuration
   */
  vertical(): FlowDirectionBuilder
}

/**
 * FlowDirectionBuilder: Configuration interface after flow direction selection
 */
export interface FlowDirectionBuilder {
  /**
   * Set wrap threshold - maximum width/height before wrapping
   * @param threshold - Wrap point in pixels
   * @returns This builder for method chaining
   */
  wrap(threshold: number): this

  /**
   * Set gap between elements
   * @param space - Distance between elements in pixels
   * @returns This builder for method chaining
   */
  gap(space: number): this

  /**
   * Finalize flow layout within specified container
   * @param container - Container bounds to flow within
   */
  in(container: ContainerBounds): void
}

/**
 * AlignBuilder: Fluent interface for alignment constraints
 * 
 * Provides methods to align multiple elements along edges or centers.
 * Each method directly applies the alignment constraint.
 * 
 * @example
 * ```typescript
 * hint.align(targets).left()      // Align left edges
 * hint.align(targets).centerX()   // Align horizontal centers
 * hint.align(targets).size()      // Align both width and height
 * ```
 */
export interface AlignBuilder {
  /**
   * Align left edges (x coordinates)
   */
  left(): void

  /**
   * Align right edges
   */
  right(): void

  /**
   * Align top edges (y coordinates)
   */
  top(): void

  /**
   * Align bottom edges
   */
  bottom(): void

  /**
   * Align horizontal centers
   */
  centerX(): void

  /**
   * Align vertical centers
   */
  centerY(): void

  /**
   * Align widths
   */
  width(): void

  /**
   * Align heights
   */
  height(): void

  /**
   * Align both width and height (equivalent to calling width() and height())
   */
  size(): void
}

// ============================================================================
// Builder State Types for Type-Safe Implementation
// ============================================================================

/**
 * BuilderState: Internal state for tracking builder configuration
 * 
 * Used by builder implementations to maintain configuration through the
 * method chain. Not typically used directly by end users.
 */
export interface BuilderState {
  /**
   * Target elements to apply layout to
   */
  targets: HintTarget[]

  /**
   * Selected axis for arrangement (undefined until x() or y() called)
   */
  axis?: "x" | "y"

  /**
   * Gap spacing between elements (optional, uses default if not set)
   */
  gap?: number

  /**
   * Container to arrange within (set by in() method)
   */
  container?: ContainerBounds
}

/**
 * WithAxis: Builder state after axis selection
 * 
 * Type utility that guarantees axis has been selected in the builder chain.
 */
export type WithAxis = BuilderState & { axis: "x" | "y" }

/**
 * ReadyState: Builder state ready for finalization
 * 
 * Ensures required fields (targets, axis) are present while gap and container
 * remain optional.
 */
export type ReadyState = Required<Pick<BuilderState, "targets" | "axis">> &
  Partial<Pick<BuilderState, "gap" | "container">>

/**
 * FlowState: State for flow builder configuration
 */
export interface FlowState {
  /**
   * Target elements to flow
   */
  targets: HintTarget[]

  /**
   * Flow direction (undefined until horizontal() or vertical() called)
   */
  direction?: "horizontal" | "vertical"

  /**
   * Wrap threshold in pixels (optional)
   */
  wrapThreshold?: number

  /**
   * Gap spacing between elements (optional)
   */
  gap?: number

  /**
   * Container to flow within (set by in() method)
   */
  container?: ContainerBounds
}
