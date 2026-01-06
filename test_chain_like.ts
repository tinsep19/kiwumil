// Test complete Chain-like structure
type Fn = (...a: any[]) => any

type TestSpec = {
  init: { start: () => unknown };
  requiredGroups?: { axis: { x: () => unknown; y: () => unknown } };
  optional?: { gap: (n: number) => unknown };
  terminal: { end: () => void };
}

type TestChain<REQG extends string> =
  // RequiredGroups section
  (TestSpec["requiredGroups"] extends Record<string, Record<string, Fn>>
    ? {
        [G in Extract<keyof TestSpec["requiredGroups"] & string, REQG>]:
          {
            [M in keyof TestSpec["requiredGroups"][G] & string]: () => void;
          }
      }[Extract<keyof TestSpec["requiredGroups"] & string, REQG>]
    : Record<string, never>)
  &
  // Terminal section
  (REQG extends never
    ? { [K in keyof TestSpec["terminal"] & string]: () => void }
    : Record<string, never>);

// Test with REQG = "axis" (not completed)
type Chain1 = TestChain<"axis">

declare const chain1: Chain1
const x1 = chain1.x

// Test with REQG = never (completed)
type Chain2 = TestChain<never>

declare const chain2: Chain2
const end2 = chain2.end

console.log(x1, end2)
