// src/core/layout_hint.ts
// HintTarget interface definition and DSL builder interfaces

import type { BoundId } from "./types"
import type { LayoutBounds, ContainerBounds } from "./bounds"
import type { BuildFluent } from "./fluent_builder_generator"
import type { FluentSpec } from "./fluent_builder_generator"

// Re-export FluentSpec for external use
export type { FluentSpec }

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
 * ArrangeSpec: Specification for arrange builder
 * 
 * Required: axis selection (x or y)
 * Optional: gap setting
 * Terminal: in (finalize with container)
 * 
 * @example
 * ```typescript
 * hint.arrange(targets)
 *   .x()              // Required: Select horizontal axis
 *   .gap(30)          // Optional: 30px spacing
 *   .in(container)    // Terminal: Finalize in container
 * ```
 */
export type ArrangeSpec = {
  init: {
    arrange: (targets: HintTarget[]) => void;
  };
  requiredGroups: {
    axis: {
      x: () => void;
      y: () => void;
    };
  };
  optional: {
    gap: (space: number) => void;
  };
  terminal: {
    in: (container: ContainerBounds) => void;
  };
};

/**
 * ArrangeBuilder: Type-safe fluent builder for sequential arrangements
 * 
 * Generated from ArrangeSpec using BuildFluent.
 * Ensures axis is selected before terminal methods are available.
 */
export type ArrangeBuilder = BuildFluent<ArrangeSpec>;

/**
 * FlowSpec: Specification for flow builder
 * 
 * Required: direction selection (horizontal or vertical)
 * Optional: wrap threshold and gap setting
 * Terminal: in (finalize with container)
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
export type FlowSpec = {
  init: {
    flow: (targets: HintTarget[]) => void;
  };
  requiredGroups: {
    direction: {
      horizontal: () => void;
      vertical: () => void;
    };
  };
  optional: {
    wrap: (threshold: number) => void;
    gap: (space: number) => void;
  };
  terminal: {
    in: (container: ContainerBounds) => void;
  };
};

/**
 * FlowBuilder: Type-safe fluent builder for flowing layouts with wrapping
 * 
 * Generated from FlowSpec using BuildFluent.
 * Similar to CSS flexbox - ensures direction is selected before terminal.
 */
export type FlowBuilder = BuildFluent<FlowSpec>;

/**
 * AlignSpec: Specification for align builder
 * 
 * Required groups: one alignment method must be selected
 * Terminal: all alignment methods are terminal (directly apply constraints)
 * 
 * @example
 * ```typescript
 * hint.align(targets).left()      // Align left edges
 * hint.align(targets).centerX()   // Align horizontal centers
 * hint.align(targets).size()      // Align both width and height
 * ```
 */
export type AlignSpec = {
  init: {
    align: (targets: HintTarget[]) => void;
  };
  terminal: {
    left: () => void;
    right: () => void;
    top: () => void;
    bottom: () => void;
    centerX: () => void;
    centerY: () => void;
    width: () => void;
    height: () => void;
    size: () => void;
  };
};

/**
 * AlignBuilder: Type-safe fluent builder for alignment constraints
 * 
 * Generated from AlignSpec using BuildFluent.
 * All methods are terminal and directly apply alignment constraints.
 */
export type AlignBuilder = BuildFluent<AlignSpec>;

