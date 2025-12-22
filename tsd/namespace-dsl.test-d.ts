import { expectType } from 'tsd'
import type { ISymbolCharacs, LayoutBounds, Variable } from '../dist/core'

// このテストはDSL内でエディタなどがユーザーに適切にサジェストするためのテストです
// 拡張したCharacsのプロパティをユーザーに適切に示すために型レベルでアクセスを保証します

// Define TestSymbolCharacs based on ISymbolCharacs, extended to include item and v
// Step 1: Define TestSymbolCharacs based on ISymbolCharacs
// Ensure no conflicts with reserved keys ('id' and 'bounds')
type TestSymbolCharacs = ISymbolCharacs<{
  item: LayoutBounds
  v: Variable
}>

// Step 2: Declare a mock node that simulates the return value of CustomPlugin's node() method
// This represents what the node() method would return after calling symbols.register
declare const node: TestSymbolCharacs

// Step 3: Add test cases to validate that TestSymbolCharacs includes item and v with correct types
// (These tests are around the expected line 155 in terms of validation location)

// Test: Verify base properties from ISymbolCharacs
expectType<string>(node.id)
expectType<LayoutBounds>(node.bounds)

// Test: Verify extended property 'item' is of type LayoutBounds
expectType<LayoutBounds>(node.item)

// Test: Verify extended property 'v' is of type Variable
expectType<Variable>(node.v)

// Test: Verify the full type is correctly inferred as TestSymbolCharacs
const fullNode: TestSymbolCharacs = node
expectType<TestSymbolCharacs>(fullNode)

// Test: Verify TestSymbolCharacs is assignable to base ISymbolCharacs
const baseCharacs: ISymbolCharacs = node
expectType<ISymbolCharacs>(baseCharacs)

// Test: Verify that TestSymbolCharacs cannot be created with reserved keys overridden
// Attempting to override 'id' should result in a never type
type InvalidTestSymbolCharacs1 = ISymbolCharacs<{ id: number; item: LayoutBounds; v: Variable }>
expectType<never>(null as unknown as InvalidTestSymbolCharacs1)

// Test: Attempting to override 'bounds' should result in a never type
type InvalidTestSymbolCharacs2 = ISymbolCharacs<{ bounds: string; item: LayoutBounds; v: Variable }>
expectType<never>(null as unknown as InvalidTestSymbolCharacs2)

// Test: Valid extension with multiple fields including item and v
type ExtendedTestSymbolCharacs = ISymbolCharacs<{
  item: LayoutBounds
  v: Variable
  additionalProp: string
}>
declare const extendedNode: ExtendedTestSymbolCharacs
expectType<LayoutBounds>(extendedNode.item)
expectType<Variable>(extendedNode.v)
expectType<string>(extendedNode.additionalProp)

// === Editor Suggestion Tests (エディタサジェストのテスト) ===
// 以下のテストは、IDEがユーザーに拡張プロパティを適切にサジェストすることを保証します

// Test: Property access suggestions - エディタがitemとvのプロパティを提案できることを検証
// When user types "node.", the editor should suggest: id, bounds, item, v
expectType<'id' | 'bounds' | 'item' | 'v'>(null as unknown as keyof TestSymbolCharacs)

// Test: Nested property access for item - ユーザーがnode.itemの深いプロパティにアクセスできることを検証
// When user types "node.item.", editor should suggest LayoutBounds properties (x, y, width, height, etc.)
expectType<number>(node.item.x.value())
expectType<number>(node.item.y.value())
expectType<number>(node.item.width.value())
expectType<number>(node.item.height.value())

// Test: Variable property access - node.vがVariableの全プロパティにアクセスできることを検証
// When user types "node.v.", editor should suggest Variable properties
expectType<string>(node.v.id)
expectType<number>(node.v.value())

// Test: Type safety in assignment - 型安全な代入が保証されることを検証
// エディタがnode.itemに正しくLayoutBoundsのみを代入できることを示唆する
declare const anotherLayoutBounds: LayoutBounds
declare const anotherVariable: Variable
const assignTest: TestSymbolCharacs = {
  id: 'test-id',
  bounds: anotherLayoutBounds,
  item: anotherLayoutBounds,  // Editor suggests LayoutBounds type here
  v: anotherVariable,         // Editor suggests Variable type here
}
expectType<TestSymbolCharacs>(assignTest)
