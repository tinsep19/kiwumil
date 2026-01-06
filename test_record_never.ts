// Test Record<string, never> intersection
type A = Record<string, never>
type B = { end: () => void }
type C = A & B

declare const c: C
c.end() // Should this work?

console.log(c)
