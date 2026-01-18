// tests/layout_hint_types.test.ts

import { describe, expect, test } from "bun:test"
import type {
  HintTarget,
  MinimalTarget,
  TargetWithContainer,
  BoundsOnlyTarget,
  ArrangeBuilder,
  FlowBuilder,
  AlignBuilder,
} from "@/core/layout_hint"
import type { BoundId } from "@/core/types"
import type { LayoutBounds, ContainerBounds } from "@/core/layout_variable"

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

describe("Builder Interface Types", () => {
  test("ArrangeBuilder has arrange init method", () => {
    // The new fluent builder has arrange() as the init method
    // This is a compile-time test to ensure the type is well-formed
    type HasArrange = ArrangeBuilder extends { arrange: (...args: any[]) => any } ? true : false
    const hasArrange: HasArrange = true

    expect(hasArrange).toBe(true)
  })

  test("FlowBuilder has flow init method", () => {
    // The new fluent builder has flow() as the init method
    type HasFlow = FlowBuilder extends { flow: (...args: any[]) => any } ? true : false
    const hasFlow: HasFlow = true

    expect(hasFlow).toBe(true)
  })

  test("AlignBuilder has align init method", () => {
    // The new fluent builder has align() as the init method
    type HasAlign = AlignBuilder extends { align: (...args: any[]) => any } ? true : false
    const hasAlign: HasAlign = true

    expect(hasAlign).toBe(true)
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
