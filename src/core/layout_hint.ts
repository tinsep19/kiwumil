// src/core/layout_hint.ts
// HintTarget interface definition and DSL builder interfaces

import type { BoundId } from "./types"
import type { LayoutBounds, ContainerBounds } from "./bounds"
import type { Fluent, Entry, Step, Terminal } from "../hint"

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
// Fluent DSL Builder Specifications and Types
// ============================================================================

/**
 * ArrangeBuilder: Type-safe fluent builder for sequential arrangements
 * 
 * Required: axis selection (x or y)
 * Optional: gap setting
 * Terminal: in (finalize with container)
 * 
 * Ensures axis is selected before terminal methods are available.
 * 
 * @example
 * ```typescript
 * hint.arrange(targets)
 *   .x()              // Required: Select horizontal axis
 *   .gap(30)          // Optional: 30px spacing
 *   .in(container)    // Terminal: Finalize in container
 * ```
 */
export type ArrangeBuilder = Fluent<{
  init: {
    arrange: Entry<[targets: HintTarget[]]>;
  };
  requiredGroups: {
    axis: {
      x: Step;
      y: Step;
    };
  };
  optional: {
    gap: Step<[space: number]>;
  };
  terminal: {
    in: Terminal<[container: ContainerBounds], void>;
  };
}>;

/**
 * FlowBuilder: Type-safe fluent builder for flowing layouts with wrapping
 * 
 * Required: direction selection (horizontal or vertical)
 * Optional: wrap threshold and gap setting
 * Terminal: in (finalize with container)
 * 
 * Similar to CSS flexbox - ensures direction is selected before terminal.
 * 
 * @example
 * ```typescript
 * hint.flow(targets)
 *   .horizontal()     // Required: Flow left-to-right
 *   .wrap(400)        // Optional: Wrap at 400px
 *   .gap(10)          // Optional: 10px spacing
 *   .in(container)    // Terminal: Finalize
 * ```
 */
export type FlowBuilder = Fluent<{
  init: {
    flow: Entry<[targets: HintTarget[]]>;
  };
  requiredGroups: {
    direction: {
      horizontal: Step;
      vertical: Step;
    };
  };
  optional: {
    wrap: Step<[threshold: number]>;
    gap: Step<[space: number]>;
  };
  terminal: {
    in: Terminal<[container: ContainerBounds], void>;
  };
}>;

/**
 * AlignBuilder: Type-safe fluent builder for alignment constraints
 * 
 * Terminal: all alignment methods are terminal (directly apply constraints)
 * 
 * All methods are terminal and directly apply alignment constraints.
 * 
 * @example
 * ```typescript
 * hint.align(targets).left()      // Align left edges
 * hint.align(targets).centerX()   // Align horizontal centers
 * hint.align(targets).size()      // Align both width and height
 * ```
 */
export type AlignBuilder = Fluent<{
  init: {
    align: Entry<[targets: HintTarget[]]>;
  };
  terminal: {
    left: Terminal<[], void>;
    right: Terminal<[], void>;
    top: Terminal<[], void>;
    bottom: Terminal<[], void>;
    centerX: Terminal<[], void>;
    centerY: Terminal<[], void>;
    width: Terminal<[], void>;
    height: Terminal<[], void>;
    size: Terminal<[], void>;
  };
}>;


