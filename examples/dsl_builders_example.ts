/**
 * DSL Builders Example
 * 
 * This example demonstrates the DSL vocabulary and builder interfaces
 * defined in layout_hint.ts and documented in docs/design/layout_dsl.md
 * 
 * Note: This is an example of how the API would be used once builder
 * implementations are created in HintFactory or a dedicated builder module.
 * 
 * The builders are now generated using the FluentSpec pattern with BuildFluent.
 */

import { TypeDiagram } from "../src/index"
import type {
  HintTarget,
  MinimalTarget,
  TargetWithContainer,
} from "../src/core/layout_hint"

/**
 * Example 1: ArrangeBuilder Pattern
 * 
 * Shows how to use the arrange() verb with fluent API to create
 * sequential layouts with custom spacing.
 */
function exampleArrangeBuilder() {
  TypeDiagram("Arrange Builder Example")
    .build(({ el, hint }) => {
      const a = el.core.rectangle("A")
      const b = el.core.rectangle("B")
      const c = el.core.rectangle("C")
      
      // Note: The arrange() method would need to be added to HintFactory
      // and would return an ArrangeBuilder instance
      
      // Example usage (conceptual):
      // hint.arrange([a, b, c])
      //   .x()              // Horizontal arrangement
      //   .gap(50)          // 50px spacing
      //   .in(container)    // Finalize in container
      
      // Current equivalent using existing API:
      hint.arrangeHorizontal(a, b, c)
      hint.alignCenterY(a, b, c)
    })
    .render(import.meta)
}

/**
 * Example 2: FlowBuilder Pattern
 * 
 * Demonstrates flowing layouts with wrapping, similar to CSS flexbox.
 */
function exampleFlowBuilder() {
  TypeDiagram("Flow Builder Example")
    .build(({ el, hint }) => {
      const items = [
        el.core.circle("1"),
        el.core.circle("2"),
        el.core.circle("3"),
        el.core.circle("4"),
        el.core.circle("5"),
      ]
      
      // Note: The flow() method would need to be added to HintFactory
      // and would return a FlowBuilder instance
      
      // Example usage (conceptual):
      // hint.flow(items)
      //   .horizontal()     // Flow left-to-right
      //   .wrap(400)        // Wrap at 400px
      //   .gap(15)          // 15px spacing
      //   .in(container)    // Finalize
      
      // Current equivalent using existing API:
      // Would require custom implementation with conditional logic
      hint.arrangeHorizontal(...items)
    })
    .render(import.meta)
}

/**
 * Example 3: AlignBuilder Pattern
 * 
 * Shows alignment operations using the fluent AlignBuilder interface.
 */
function exampleAlignBuilder() {
  TypeDiagram("Align Builder Example")
    .build(({ el, hint }) => {
      const a = el.core.rectangle("A")
      const b = el.core.rectangle("B")
      const c = el.core.rectangle("C")
      
      // Note: The align() method would need to be added to HintFactory
      // and would return an AlignBuilder instance
      
      // Example usage (conceptual):
      // hint.align([a, b, c]).left()      // Align left edges
      // hint.align([a, b, c]).centerX()   // Align centers
      // hint.align([a, b, c]).size()      // Align both width & height
      
      // Current equivalent using existing API:
      hint.alignLeft(a, b, c)
      hint.alignCenterY(a, b, c)
      hint.arrangeVertical(a, b, c)
    })
    .render(import.meta)
}

/**
 * Example 4: Combined Builders
 * 
 * Demonstrates combining multiple builder patterns for complex layouts.
 */
function exampleCombinedBuilders() {
  TypeDiagram("Combined Builders Example")
    .build(({ el, hint }) => {
      const header = el.core.rectangle("Header")
      const sidebar = el.core.rectangle("Sidebar")
      const content = el.core.rectangle("Content")
      const footer = el.core.rectangle("Footer")
      
      // Example usage (conceptual):
      // Create vertical stack
      // hint.arrange([header, content, footer])
      //   .y()
      //   .gap(20)
      //   .in(container)
      
      // Align all widths
      // hint.align([header, content, footer]).width()
      
      // Current equivalent using existing API:
      hint.grid([
        [header],
        [sidebar, content],
        [footer]
      ])
        .gap({ row: 20, col: 20 })
        .layout()
    })
    .render(import.meta)
}

/**
 * Example 5: Type-Safe Fluent Builder
 * 
 * Demonstrates how the generic BuildFluent type ensures type safety
 * through spec-based builder generation.
 */
function exampleTypeSafety() {
  // This is a compile-time demonstration showing how the fluent builder
  // pattern ensures type safety through the FluentSpec
  
  // Example: Extract minimal fields
  function processMinimalTarget(target: MinimalTarget) {
    // Only boundId and bounds are available
    console.log(target.boundId)
    console.log(target.bounds)
    // target.container  // Error: Property doesn't exist
  }
  
  // Example: Require container
  function processNestedLayout(target: TargetWithContainer) {
    // Container is guaranteed to exist
    console.log(target.container.boundId)
  }
  
  // The new fluent builders use FluentSpec to define:
  // - init methods (arrange, flow, align)
  // - requiredGroups (axis selection for arrange, direction for flow)
  // - optional methods (gap, wrap)
  // - terminal methods (in)
  //
  // BuildFluent<Spec> generates the type-safe builder that ensures
  // required methods are called before terminal methods are available
}

/**
 * Example 6: Utility Type Patterns
 * 
 * Shows practical patterns for using Pick and Omit in custom code.
 */
function exampleUtilityTypePatterns() {
  // Pattern 1: Extract only position info
  type PositionOnly = Pick<HintTarget, "bounds">
  
  function getPosition(target: PositionOnly) {
    return {
      x: target.bounds.x.value(),
      y: target.bounds.y.value(),
    }
  }
  
  // Pattern 2: Configuration without bounds
  type ConfigWithoutBounds = Omit<HintTarget, "bounds">
  
  function processMetadata(config: ConfigWithoutBounds) {
    console.log(config.boundId)
    // Optional container
    if (config.container) {
      console.log(config.container.boundId)
    }
  }
  
  // Pattern 3: Conditional container requirement
  type LayoutConfig<TNested extends boolean> = TNested extends true
    ? Required<Pick<HintTarget, "container">>
    : Omit<HintTarget, "container">
  
  function applyLayout<T extends boolean>(
    nested: T,
    config: LayoutConfig<T>
  ) {
    if (nested) {
      // TypeScript knows container exists when nested=true
      const c = (config as Required<Pick<HintTarget, "container">>).container
      console.log(c.boundId)
    }
  }
}

// Export for documentation purposes
export {
  exampleArrangeBuilder,
  exampleFlowBuilder,
  exampleAlignBuilder,
  exampleCombinedBuilders,
  exampleTypeSafety,
  exampleUtilityTypePatterns,
}
