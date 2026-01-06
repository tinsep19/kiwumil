// Test what happens with indexed access [never]
type TestGroups = {
  axis: { x: () => void; y: () => void };
}

// When REQG = never
type REQG = never

type MappedType = {
  [G in Extract<keyof TestGroups & string, REQG>]: {
    [M in keyof TestGroups[G] & string]: () => void;
  }
}

// What is MappedType?
// Extract<"axis", never> = never
// So MappedType = { [G in never]: ... } = {}

type IndexedType = MappedType[Extract<keyof TestGroups & string, REQG>]

// What is IndexedType?
// MappedType[never] = ?

// Let's check if IndexedType is never
type IsNever = IndexedType extends never ? true : false
const isNever: IsNever = true

// Let's check if IndexedType is {}
type IsEmptyObject = IndexedType extends {} ? true : false
const isEmptyObject: IsEmptyObject = true

// Let's try to use it
declare const indexed: IndexedType
// If it has properties, this should work
// @ts-expect-error
indexed.x

console.log(indexed, isNever, isEmptyObject)
