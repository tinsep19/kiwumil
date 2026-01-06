// tsd/fluent_optional_once.test-d.ts
// Type-level tests for optional methods being callable only once

import { expectType, expectError } from "tsd"
import type { Fluent } from "../src/hint"

// Test spec with optional methods
type TestSpec = {
  init: {
    start: () => unknown;
  };
  optional: {
    setName: (name: string) => unknown;
    setAge: (age: number) => unknown;
  };
  terminal: {
    build: () => { name?: string; age?: number };
  };
};

type TestBuilder = Fluent<TestSpec>

// Create a mock builder instance
declare const builder: TestBuilder

// Start the chain
const step1 = builder.start()

// First call to setName should work
const step2 = step1.setName("John")

// Second call to setName should fail (method should not exist)
expectError(step2.setName("Jane"))

// setAge should still be available after calling setName
const step3 = step2.setAge(30)

// After calling setAge, it should no longer be available
expectError(step3.setAge(31))

// After calling both optional methods, only terminal should be available
const result = step3.build()
expectType<{ name?: string; age?: number }>(result)

// Test that optional methods can be called in any order
const alt1 = builder.start()
const alt2 = alt1.setAge(25)
const alt3 = alt2.setName("Alice")
expectError(alt3.setAge(26))
expectError(alt3.setName("Bob"))
const altResult = alt3.build()
expectType<{ name?: string; age?: number }>(altResult)
