// tsd/layout_hint_builders.test-d.ts
// Type-level tests for layout hint builder interfaces

import { expectType, expectAssignable, expectNotAssignable } from "tsd"
import type {
  HintTarget,
  MinimalTarget,
  TargetWithContainer,
  BoundsOnlyTarget,
  ArrangeBuilder,
  FlowBuilder,
  AlignBuilder,
} from "../src/core/layout_hint"
import type { BoundId } from "../src/core/types"
import type { LayoutBounds, ContainerBounds } from "../src/core/layout_variable"

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


// ============================================================================
// Test Builder Interfaces (Generated from FluentSpec)
// ============================================================================

// Test that builders have their init methods
declare const arrangeBuilder: ArrangeBuilder
declare const flowBuilder: FlowBuilder
declare const alignBuilder: AlignBuilder

// These should compile if the types are correctly generated
void arrangeBuilder.arrange
void flowBuilder.flow
void alignBuilder.align

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
