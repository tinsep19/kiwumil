// tests/layout_hint_types.test.ts

import { describe, expect, test } from "bun:test"
import type {
  HintTarget,
  MinimalTarget,
  TargetWithContainer,
  BoundsOnlyTarget,
  BuilderState,
  WithAxis,
  ReadyState,
  FlowState,
  ArrangeBuilder,
  ArrangeAxisBuilder,
  FlowBuilder,
  FlowDirectionBuilder,
  AlignBuilder,
} from "@/core/layout_hint"
import type { BoundId } from "@/core/types"
import type { LayoutBounds, ContainerBounds } from "@/core/bounds"

describe("HintTarget Type Utilities", () => {
  test("MinimalTarget includes only boundId and bounds", () => {
    // This is a compile-time test - if it compiles, the types are correct
    const minimal: MinimalTarget = {
      boundId: "test" as BoundId,
      bounds: {} as LayoutBounds,
    }
    
    expect(minimal.boundId).toBeDefined()
    expect(minimal.bounds).toBeDefined()
  })

  test("TargetWithContainer requires container field", () => {
    // This is a compile-time test
    const withContainer: TargetWithContainer = {
      boundId: "test" as BoundId,
      bounds: {} as LayoutBounds,
      container: {} as ContainerBounds, // Required
    }
    
    expect(withContainer.container).toBeDefined()
  })

  test("BoundsOnlyTarget excludes boundId", () => {
    // This is a compile-time test
    const boundsOnly: BoundsOnlyTarget = {
      bounds: {} as LayoutBounds,
      container: {} as ContainerBounds, // Optional
    }
    
    expect(boundsOnly.bounds).toBeDefined()
  })

  test("HintTarget matches expected structure", () => {
    const target: HintTarget = {
      boundId: "test" as BoundId,
      bounds: {} as LayoutBounds,
      container: {} as ContainerBounds, // Optional
    }
    
    expect(target.boundId).toBeDefined()
    expect(target.bounds).toBeDefined()
    expect(target.container).toBeDefined()
  })
})

describe("Builder State Types", () => {
  test("BuilderState has correct structure", () => {
    const state: BuilderState = {
      targets: [],
      axis: "x", // Optional
      gap: 10, // Optional
      container: {} as ContainerBounds, // Optional
    }
    
    expect(state.targets).toEqual([])
    expect(state.axis).toBe("x")
    expect(state.gap).toBe(10)
  })

  test("WithAxis requires axis to be defined", () => {
    const withAxis: WithAxis = {
      targets: [],
      axis: "y", // Required by WithAxis
    }
    
    expect(withAxis.axis).toBe("y")
  })

  test("ReadyState requires targets and axis", () => {
    const ready: ReadyState = {
      targets: [],
      axis: "x", // Required
      gap: 20, // Optional
      // container is optional
    }
    
    expect(ready.targets).toBeDefined()
    expect(ready.axis).toBeDefined()
  })

  test("FlowState has correct structure", () => {
    const flowState: FlowState = {
      targets: [],
      direction: "horizontal", // Optional
      wrapThreshold: 400, // Optional
      gap: 15, // Optional
      container: {} as ContainerBounds, // Optional
    }
    
    expect(flowState.targets).toEqual([])
    expect(flowState.direction).toBe("horizontal")
    expect(flowState.wrapThreshold).toBe(400)
  })
})

describe("Builder Interface Types", () => {
  test("ArrangeBuilder interface shape", () => {
    // This is a compile-time test to ensure interface is well-formed
    const mockBuilder: ArrangeBuilder = {
      x: () => ({} as ArrangeAxisBuilder),
      y: () => ({} as ArrangeAxisBuilder),
    }
    
    expect(mockBuilder.x).toBeDefined()
    expect(mockBuilder.y).toBeDefined()
  })

  test("ArrangeAxisBuilder interface shape", () => {
    const mockAxisBuilder: ArrangeAxisBuilder = {
      gap: (space: number) => mockAxisBuilder,
      in: (container: ContainerBounds) => {},
    }
    
    expect(mockAxisBuilder.gap).toBeDefined()
    expect(mockAxisBuilder.in).toBeDefined()
  })

  test("FlowBuilder interface shape", () => {
    const mockFlowBuilder: FlowBuilder = {
      horizontal: () => ({} as FlowDirectionBuilder),
      vertical: () => ({} as FlowDirectionBuilder),
    }
    
    expect(mockFlowBuilder.horizontal).toBeDefined()
    expect(mockFlowBuilder.vertical).toBeDefined()
  })

  test("FlowDirectionBuilder interface shape", () => {
    const mockDirectionBuilder: FlowDirectionBuilder = {
      wrap: (threshold: number) => mockDirectionBuilder,
      gap: (space: number) => mockDirectionBuilder,
      in: (container: ContainerBounds) => {},
    }
    
    expect(mockDirectionBuilder.wrap).toBeDefined()
    expect(mockDirectionBuilder.gap).toBeDefined()
    expect(mockDirectionBuilder.in).toBeDefined()
  })

  test("AlignBuilder interface shape", () => {
    const mockAlignBuilder: AlignBuilder = {
      left: () => {},
      right: () => {},
      top: () => {},
      bottom: () => {},
      centerX: () => {},
      centerY: () => {},
      width: () => {},
      height: () => {},
      size: () => {},
    }
    
    expect(mockAlignBuilder.left).toBeDefined()
    expect(mockAlignBuilder.right).toBeDefined()
    expect(mockAlignBuilder.top).toBeDefined()
    expect(mockAlignBuilder.bottom).toBeDefined()
    expect(mockAlignBuilder.centerX).toBeDefined()
    expect(mockAlignBuilder.centerY).toBeDefined()
    expect(mockAlignBuilder.width).toBeDefined()
    expect(mockAlignBuilder.height).toBeDefined()
    expect(mockAlignBuilder.size).toBeDefined()
  })
})

describe("Type Utility Patterns", () => {
  test("Pick extracts specific fields", () => {
    type OnlyBounds = Pick<HintTarget, "bounds">
    
    const obj: OnlyBounds = {
      bounds: {} as LayoutBounds,
    }
    
    expect(obj.bounds).toBeDefined()
  })

  test("Omit excludes specific fields", () => {
    type WithoutContainer = Omit<HintTarget, "container">
    
    const obj: WithoutContainer = {
      boundId: "test" as BoundId,
      bounds: {} as LayoutBounds,
    }
    
    expect(obj.boundId).toBeDefined()
    expect(obj.bounds).toBeDefined()
  })

  test("Required makes all fields required", () => {
    type AllRequired = Required<HintTarget>
    
    const obj: AllRequired = {
      boundId: "test" as BoundId,
      bounds: {} as LayoutBounds,
      container: {} as ContainerBounds, // No longer optional
    }
    
    expect(obj.container).toBeDefined()
  })

  test("Partial makes all fields optional", () => {
    type AllOptional = Partial<HintTarget>
    
    const obj: AllOptional = {
      // All fields are optional
    }
    
    expect(obj).toBeDefined()
  })

  test("Combined utilities work together", () => {
    // Extract specific fields and make them required
    type SpecificRequired = Required<Pick<HintTarget, "boundId" | "bounds">>
    
    const obj: SpecificRequired = {
      boundId: "test" as BoundId,
      bounds: {} as LayoutBounds,
    }
    
    expect(obj.boundId).toBeDefined()
    expect(obj.bounds).toBeDefined()
  })
})
