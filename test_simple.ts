// Simple test to debug the type generation
import type { Fluent } from "./src/hint/fluent_builder_generator"

type SimpleSpec = {
  init: {
    start: () => unknown;
  };
  terminal: {
    end: () => void;
  };
};

type SimpleBuilder = Fluent<SimpleSpec>

declare const builder: SimpleBuilder

const step1 = builder.start()
const result = step1.end()

console.log(result)
