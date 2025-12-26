import { expectType } from 'tsd'
import { TypeDiagram } from '../src/dsl'
import type { DiagramPlugin } from '../src/dsl/diagram_plugin'
import type { Symbols } from '../src/model'
import type { Theme } from '../src/theme'
import type { ISymbolCharacs } from '../src/core/symbol'
import type { LayoutBounds } from '../src/core/bounds'
import type { Variable } from '../src/core/layout_variable'
import type { PluginIcons } from '../src/dsl/namespace_types'

// このテストはDSL内でエディタなどがユーザーに適切にサジェストするためのテストです
// 拡張したCharacsのプロパティをユーザーに適切に示すために型レベルでアクセスを保証します

// Step 1: Define TestSymbolCharacs based on ISymbolCharacs
// Ensure no conflicts with reserved keys ('id' and 'bounds')
type TestSymbolCharacs = ISymbolCharacs<{
  item: LayoutBounds
  v: Variable
}>

// Step 2: Create CustomPlugin with node() method that returns TestSymbolCharacs
const CustomPlugin = {
  name: 'custom',
  createSymbolFactory(symbols: Symbols, theme: Theme, icons: PluginIcons) {
    return {
      node(label: string): TestSymbolCharacs {
        const registration = symbols.register('custom', 'node', (symbolId, builder) => {
          const bounds = builder.createLayoutBounds('bounds')
          const item = builder.createLayoutBounds('item')
          const v = builder.createVariable('v')

          builder.setCharacs({
            id: symbolId,
            bounds,
            item,
            v,
          })

          builder.setSymbol({
            id: symbolId,
            bounds,
            render: () => `<text>${label}</text>`,
            getConnectionPoint: (src) => src,
          })

          builder.setConstraint((cb) => {
            cb.ct([1, bounds.width]).eq([100, 1]).strong()
            cb.ct([1, bounds.height]).eq([50, 1]).strong()
          })

          return builder.build()
        })

        return registration.characs
      },
    }
  },
} as const satisfies DiagramPlugin

// Step 3: Create DiagramBuilder with CustomPlugin
const builder = TypeDiagram('Test Diagram').use(CustomPlugin)

type BuilderCallback = Parameters<typeof builder['build']>[0]

// Step 4: Test within the build callback block - this is where users actually write code
// DiagramBuilderのbuildメソッドに渡されるblockコールバック内でテストします
const testCallback: BuilderCallback = ({ el }) => {
  // Verify el.custom namespace exists
  const customNamespace = el.custom

  // Create a node using the custom plugin - this is where editor autocomplete happens
  const node = customNamespace.node('Test Node')

  // === Type Tests for TestSymbolCharacs ===
  
  // Test: Verify the node has extended properties (no type assertion needed!)
  const typedNode = node
  
  // Test: Verify base properties from ISymbolCharacs
  expectType<string>(typedNode.id)
  expectType<LayoutBounds>(typedNode.bounds)

  // Test: Verify extended property 'item' is of type LayoutBounds
  expectType<LayoutBounds>(typedNode.item)

  // Test: Verify extended property 'v' is of type Variable
  expectType<Variable>(typedNode.v)

  // Test: Property access suggestions - エディタがitemとvのプロパティを提案できることを検証
  // When user types "node.", the editor should suggest: id, bounds, item, v
  expectType<'id' | 'bounds' | 'item' | 'v'>(null as unknown as keyof TestSymbolCharacs)

  // Test: Nested property access for item - ユーザーがnode.itemの深いプロパティにアクセスできることを検証
  // When user types "node.item.", editor should suggest LayoutBounds properties (x, y, width, height, etc.)
  expectType<number>(typedNode.item.x.value())
  expectType<number>(typedNode.item.y.value())
  expectType<number>(typedNode.item.width.value())
  expectType<number>(typedNode.item.height.value())

  // Test: Variable property access - node.vがVariableの全プロパティにアクセスできることを検証
  // When user types "node.v.", editor should suggest Variable properties
  expectType<string>(typedNode.v.id)
  expectType<number>(typedNode.v.value())
}

// Execute the builder with the test callback
builder.build(testCallback)

// === Additional Type Tests Outside Callback ===

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
