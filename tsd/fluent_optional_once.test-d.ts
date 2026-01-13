// tsd/fluent_optional_once.test-d.ts
// Test that optional methods can only be called once

import { expectType, expectError } from "tsd"
import type { ArrangeBuilder, FlowBuilder, HintTarget } from "../src/core/layout_hint"
import type { ContainerBounds } from "../src/core/layout_variable"

declare const targets: HintTarget[]
declare const container: ContainerBounds

// ============================================================================
// Test ArrangeBuilder - optional gap method
// ============================================================================

declare const arrangeBuilder: ArrangeBuilder

// Start with arrange
const step1 = arrangeBuilder.arrange(targets)

// Select required axis
const step2 = step1.x()

// First call to gap should work
const step3 = step2.gap(10)

// Second call to gap should NOT work
expectError(step3.gap(20))

// Terminal should still work
expectType<void>(step3.in(container))

// ============================================================================
// Test FlowBuilder - optional wrap and gap methods
// ============================================================================

declare const flowBuilder: FlowBuilder

// Start with flow
const flow1 = flowBuilder.flow(targets)

// Select required direction
const flow2 = flow1.horizontal()

// First call to wrap should work
const flow3 = flow2.wrap(400)

// Second call to wrap should NOT work
expectError(flow3.wrap(500))

// gap should still be available after calling wrap
const flow4 = flow3.gap(10)

// Second call to gap should NOT work
expectError(flow4.gap(20))

// Terminal should work
expectType<void>(flow4.in(container))

// Test that gap can be called before wrap
const flowAlt1 = flowBuilder.flow(targets)
const flowAlt2 = flowAlt1.vertical()
const flowAlt3 = flowAlt2.gap(15)
const flowAlt4 = flowAlt3.wrap(300)
expectError(flowAlt4.gap(25))
expectError(flowAlt4.wrap(350))
expectType<void>(flowAlt4.in(container))
