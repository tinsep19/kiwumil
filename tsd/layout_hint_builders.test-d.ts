// tsd/layout_hint_builders.test-d.ts
// Type-level tests for layout hint builder interfaces

import { expectType, expectAssignable, expectNotAssignable } from "tsd"
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
} from "../src/core/layout_hint"
import type { BoundId } from "../src/core/types"
import type { LayoutBounds, ContainerBounds } from "../src/core/bounds"

// ============================================================================
// Test Utility Types
// ============================================================================

// MinimalTarget should be assignable to partial HintTarget
expectAssignable<Partial<HintTarget>>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
} as MinimalTarget)

// MinimalTarget should not allow container
expectNotAssignable<MinimalTarget>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
  container: {} as ContainerBounds,
})

// TargetWithContainer requires all fields
expectNotAssignable<TargetWithContainer>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
  // Missing container
})

// BoundsOnlyTarget should not have boundId
expectNotAssignable<BoundsOnlyTarget>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
})

// ============================================================================
// Test Builder State Types
// ============================================================================

// BuilderState allows all fields to be optional except targets
expectAssignable<BuilderState>({
  targets: [],
})

expectAssignable<BuilderState>({
  targets: [],
  axis: "x",
  gap: 10,
  container: {} as ContainerBounds,
})

// WithAxis requires axis field
expectNotAssignable<WithAxis>({
  targets: [],
  // Missing axis
})

expectAssignable<WithAxis>({
  targets: [],
  axis: "y",
})

// ReadyState requires targets and axis
expectNotAssignable<ReadyState>({
  targets: [],
  // Missing axis
})

expectAssignable<ReadyState>({
  targets: [],
  axis: "x",
})

expectAssignable<ReadyState>({
  targets: [],
  axis: "y",
  gap: 20,
  container: {} as ContainerBounds,
})

// FlowState structure
expectAssignable<FlowState>({
  targets: [],
})

expectAssignable<FlowState>({
  targets: [],
  direction: "horizontal",
  wrapThreshold: 400,
  gap: 15,
  container: {} as ContainerBounds,
})

// ============================================================================
// Test Builder Interfaces
// ============================================================================

// ArrangeBuilder should have x() and y() methods
const arrangeBuilder = {} as ArrangeBuilder
expectType<ArrangeAxisBuilder>(arrangeBuilder.x())
expectType<ArrangeAxisBuilder>(arrangeBuilder.y())

// ArrangeAxisBuilder should support method chaining
const axisBuilder = {} as ArrangeAxisBuilder
expectType<ArrangeAxisBuilder>(axisBuilder.gap(10))
expectType<void>(axisBuilder.in({} as ContainerBounds))

// FlowBuilder should have horizontal() and vertical() methods
const flowBuilder = {} as FlowBuilder
expectType<FlowDirectionBuilder>(flowBuilder.horizontal())
expectType<FlowDirectionBuilder>(flowBuilder.vertical())

// FlowDirectionBuilder should support method chaining
const directionBuilder = {} as FlowDirectionBuilder
expectType<FlowDirectionBuilder>(directionBuilder.wrap(400))
expectType<FlowDirectionBuilder>(directionBuilder.gap(10))
expectType<void>(directionBuilder.in({} as ContainerBounds))

// AlignBuilder should have all alignment methods
const alignBuilder = {} as AlignBuilder
expectType<void>(alignBuilder.left())
expectType<void>(alignBuilder.right())
expectType<void>(alignBuilder.top())
expectType<void>(alignBuilder.bottom())
expectType<void>(alignBuilder.centerX())
expectType<void>(alignBuilder.centerY())
expectType<void>(alignBuilder.width())
expectType<void>(alignBuilder.height())
expectType<void>(alignBuilder.size())

// ============================================================================
// Test Type Composition
// ============================================================================

// Test that Pick works correctly
type OnlyBounds = Pick<HintTarget, "bounds">
expectAssignable<OnlyBounds>({
  bounds: {} as LayoutBounds,
})
expectNotAssignable<OnlyBounds>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
})

// Test that Omit works correctly
type WithoutBounds = Omit<HintTarget, "bounds">
expectAssignable<WithoutBounds>({
  boundId: "test" as BoundId,
})
expectNotAssignable<WithoutBounds>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
})

// Test that Required works correctly
type AllRequired = Required<HintTarget>
expectNotAssignable<AllRequired>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
  // Missing container
})
expectAssignable<AllRequired>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
  container: {} as ContainerBounds,
})

// Test complex type combinations
type ComplexType = Required<Pick<HintTarget, "boundId" | "bounds">> &
  Partial<Pick<HintTarget, "container">>

expectAssignable<ComplexType>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
})

expectAssignable<ComplexType>({
  boundId: "test" as BoundId,
  bounds: {} as LayoutBounds,
  container: {} as ContainerBounds,
})

expectNotAssignable<ComplexType>({
  boundId: "test" as BoundId,
  // Missing bounds
})
