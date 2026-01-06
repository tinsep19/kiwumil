// tsd/fluent_debug.test-d.ts
// Debug test for understanding the current optional behavior

import type { Fluent } from "../src/hint"

// Minimal test spec with only optional and terminal
type MinimalSpec = {
  init: {
    start: () => unknown;
  };
  optional: {
    setName: (name: string) => unknown;
  };
  terminal: {
    build: () => string;
  };
};

type MinimalBuilder = Fluent<MinimalSpec>

declare const builder: MinimalBuilder

const step1 = builder.start()

// What type is step1?
// It should have: setName and build

type Step1Type = typeof step1
// @ts-expect-error - checking if setName exists
const hasSetName: Step1Type["setName"] = undefined

// Call setName
const step2 = step1.setName("test")

// What type is step2?
type Step2Type = typeof step2
// @ts-expect-error - checking if setName still exists
const stillHasSetName: Step2Type["setName"] = undefined
