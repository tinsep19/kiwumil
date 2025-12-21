import { expectType, expectError, expectNotAssignable } from "tsd"
import type {
  ISymbolCharacs,
  IContainerSymbolCharacs,
  Variable,
  LayoutBounds,
  ContainerBounds,
  ItemBounds,
} from "../dist/core"

// Test 1: Basic ISymbolCharacs without extensions (default empty object)
declare const basicCharacs: ISymbolCharacs
expectType<string>(basicCharacs.id)
expectType<LayoutBounds>(basicCharacs.bounds)

// Test 2: ISymbolCharacs with single extended field
type ICustomSymbolCharacs = ISymbolCharacs<{ customField: string }>
declare const customCharacs: ICustomSymbolCharacs
expectType<string>(customCharacs.id)
expectType<LayoutBounds>(customCharacs.bounds)
expectType<string>(customCharacs.customField)

// Test 3: ISymbolCharacs with Variable extension
type IVarSymbolCharacs = ISymbolCharacs<{ customVar: Variable }>
declare const varCharacs: IVarSymbolCharacs
expectType<string>(varCharacs.id)
expectType<LayoutBounds>(varCharacs.bounds)
expectType<Variable>(varCharacs.customVar)

// Test 4: ISymbolCharacs with multiple extended fields
type IMultiExtendedCharacs = ISymbolCharacs<{
  field1: string
  field2: number
  field3: Variable
}>
declare const multiCharacs: IMultiExtendedCharacs
expectType<string>(multiCharacs.id)
expectType<LayoutBounds>(multiCharacs.bounds)
expectType<string>(multiCharacs.field1)
expectType<number>(multiCharacs.field2)
expectType<Variable>(multiCharacs.field3)

// Test 5: ISymbolCharacs with ContainerBounds extension
type IContainerExtendedCharacs = ISymbolCharacs<{ container: ContainerBounds }>
declare const containerCharacs: IContainerExtendedCharacs
expectType<string>(containerCharacs.id)
expectType<LayoutBounds>(containerCharacs.bounds)
expectType<ContainerBounds>(containerCharacs.container)

// Test 6: ISymbolCharacs with ItemBounds extension
type IItemExtendedCharacs = ISymbolCharacs<{ item: ItemBounds }>
declare const itemCharacs: IItemExtendedCharacs
expectType<string>(itemCharacs.id)
expectType<LayoutBounds>(itemCharacs.bounds)
expectType<ItemBounds>(itemCharacs.item)

// Test 7: IContainerSymbolCharacs should be equivalent to ISymbolCharacs<{ container: ContainerBounds }>
declare const containerSymbol: IContainerSymbolCharacs
expectType<string>(containerSymbol.id)
expectType<LayoutBounds>(containerSymbol.bounds)
expectType<ContainerBounds>(containerSymbol.container)

// Test 8: IContainerSymbolCharacs is assignable to ISymbolCharacs<{ container: ContainerBounds }>
expectType<ISymbolCharacs<{ container: ContainerBounds }>>(containerSymbol)

// Test 9: Forbidden - Cannot override 'id' field
// When 'id' is in the extension type, NoBaseOverlap returns never,
// so the intersection with never results in the entire type becoming never
type InvalidIdOverride = ISymbolCharacs<{ id: number }>
// This type should be never because we're trying to override a forbidden key
expectType<never>(null as unknown as InvalidIdOverride)

// Test 10: Forbidden - Cannot override 'bounds' field
type InvalidBoundsOverride = ISymbolCharacs<{ bounds: string }>
// This type should be never because we're trying to override a forbidden key
expectType<never>(null as unknown as InvalidBoundsOverride)

// Test 11: Forbidden - Cannot override both 'id' and 'bounds'
type InvalidBothOverride = ISymbolCharacs<{ id: number; bounds: string }>
// This type should be never because we're trying to override forbidden keys
expectType<never>(null as unknown as InvalidBothOverride)

// Test 12: Complex extension with multiple bounds types
type IComplexCharacs = ISymbolCharacs<{
  container: ContainerBounds
  item1: ItemBounds
  item2: ItemBounds
  radius: Variable
  label: string
}>
declare const complexCharacs: IComplexCharacs
expectType<string>(complexCharacs.id)
expectType<LayoutBounds>(complexCharacs.bounds)
expectType<ContainerBounds>(complexCharacs.container)
expectType<ItemBounds>(complexCharacs.item1)
expectType<ItemBounds>(complexCharacs.item2)
expectType<Variable>(complexCharacs.radius)
expectType<string>(complexCharacs.label)

// Test 13: Assignability - basic characs is assignable to extended characs with optional fields
declare const basicCharacs2: ISymbolCharacs
// Basic characs should not be assignable to extended characs (missing required fields)
expectNotAssignable<ISymbolCharacs<{ customField: string }>>(basicCharacs2)

// Test 14: Assignability - extended characs with extra fields
declare const extendedCharacs: ISymbolCharacs<{ extra: string }>
// Extended characs can be assigned to a variable expecting any ISymbolCharacs type
const anyCharacs: ISymbolCharacs = extendedCharacs
expectType<string>(anyCharacs.id)
expectType<LayoutBounds>(anyCharacs.bounds)

// Test 15: Object literal with extended fields
declare const literalBounds: LayoutBounds
const literalCharacs: ISymbolCharacs<{ myField: string }> = {
  id: "test-id" as string,
  bounds: literalBounds,
  myField: "value",
}
expectType<string>(literalCharacs.id)
expectType<LayoutBounds>(literalCharacs.bounds)
expectType<string>(literalCharacs.myField)

// Test 16: Empty extension is equivalent to base ISymbolCharacs
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type EmptyExtension = ISymbolCharacs<{}>
declare const emptyExt: EmptyExtension
const baseCharacs: ISymbolCharacs = emptyExt
expectType<string>(baseCharacs.id)
expectType<LayoutBounds>(baseCharacs.bounds)

// Test 17: Verify that attempting to add id or bounds as extra fields
// results in the entire type becoming never due to NoBaseOverlap
type ShouldPreventOverride = ISymbolCharacs<{ id: string }>
// The type should be never because id is a forbidden key
expectType<never>(null as unknown as ShouldPreventOverride)
