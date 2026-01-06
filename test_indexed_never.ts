// Test indexed access with never
type TestObj = {
  a: { x: number };
  b: { y: string };
}

type Test1 = TestObj["a"] // Should be { x: number }
type Test2 = TestObj[never] // What is this?

declare const test1: Test1
declare const test2: Test2

console.log(test1, test2)
