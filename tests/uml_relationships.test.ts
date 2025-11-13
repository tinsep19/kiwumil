// tests/uml_relationships.test.ts
import { describe, test, expect } from "bun:test"
import { DiagramBuilder } from "../src/dsl/diagram_builder"
import { UMLPlugin } from "../src/plugin/uml"

describe("UML Relationships", () => {
  describe("Include Relationship", () => {
    test("should create include relationship between use cases", () => {
      const builder = new DiagramBuilder("Test Diagram")
      builder.use(UMLPlugin)

      const result = builder.build((element, relation) => {
        const usecaseA = element.usecase("UseCase A")
        const usecaseB = element.usecase("UseCase B")
        relation.include(usecaseA, usecaseB)
      })

      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].constructor.name).toBe("Include")
    })

    test("should generate SVG with dashed line and stereotype", () => {
      const builder = new DiagramBuilder("Test Diagram")
      builder.use(UMLPlugin)

      const result = builder.build((element, relation, hint) => {
        const usecaseA = element.usecase("UseCase A")
        const usecaseB = element.usecase("UseCase B")
        relation.include(usecaseA, usecaseB)
        hint.horizontal(usecaseA, usecaseB)
      })

      const svg = result.relationships[0].toSVG(new Map(
        result.symbols.map(s => [s.id, s])
      ))
      
      expect(svg).toContain("stroke-dasharray")
      expect(svg).toContain("«include»")
    })
  })

  describe("Extend Relationship", () => {
    test("should create extend relationship between use cases", () => {
      const builder = new DiagramBuilder("Test Diagram")
      builder.use(UMLPlugin)

      const result = builder.build((element, relation) => {
        const usecaseA = element.usecase("UseCase A")
        const usecaseB = element.usecase("UseCase B")
        relation.extend(usecaseA, usecaseB)
      })

      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].constructor.name).toBe("Extend")
    })

    test("should generate SVG with dashed line and stereotype", () => {
      const builder = new DiagramBuilder("Test Diagram")
      builder.use(UMLPlugin)

      const result = builder.build((element, relation, hint) => {
        const usecaseA = element.usecase("UseCase A")
        const usecaseB = element.usecase("UseCase B")
        relation.extend(usecaseA, usecaseB)
        hint.horizontal(usecaseA, usecaseB)
      })

      const svg = result.relationships[0].toSVG(new Map(
        result.symbols.map(s => [s.id, s])
      ))
      
      expect(svg).toContain("stroke-dasharray")
      expect(svg).toContain("«extend»")
    })
  })

  describe("Generalize Relationship", () => {
    test("should create generalization relationship between use cases", () => {
      const builder = new DiagramBuilder("Test Diagram")
      builder.use(UMLPlugin)

      const result = builder.build((element, relation) => {
        const usecaseA = element.usecase("UseCase A")
        const usecaseB = element.usecase("UseCase B")
        relation.generalize(usecaseA, usecaseB)
      })

      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].constructor.name).toBe("Generalize")
    })

    test("should generate SVG with solid line and triangle", () => {
      const builder = new DiagramBuilder("Test Diagram")
      builder.use(UMLPlugin)

      const result = builder.build((element, relation, hint) => {
        const usecaseA = element.usecase("UseCase A")
        const usecaseB = element.usecase("UseCase B")
        relation.generalize(usecaseA, usecaseB)
        hint.horizontal(usecaseA, usecaseB)
      })

      const svg = result.relationships[0].toSVG(new Map(
        result.symbols.map(s => [s.id, s])
      ))
      
      expect(svg).toContain("polygon")
      expect(svg).toContain("fill")
    })
  })

  describe("Combined Relationships", () => {
    test("should support multiple relationship types in same diagram", () => {
      const builder = new DiagramBuilder("Test Diagram")
      builder.use(UMLPlugin)

      const result = builder.build((element, relation, hint) => {
        const usecaseA = element.usecase("UseCase A")
        const usecaseB = element.usecase("UseCase B")
        const usecaseC = element.usecase("UseCase C")
        
        relation.include(usecaseA, usecaseB)
        relation.extend(usecaseB, usecaseC)
        relation.generalize(usecaseC, usecaseA)
        
        hint.vertical(usecaseA, usecaseB)
        hint.horizontal(usecaseB, usecaseC)
      })

      expect(result.relationships).toHaveLength(3)
      // DiagramSymbol + 3 use cases = 4
      expect(result.symbols).toHaveLength(4)
      
      const relationTypes = result.relationships.map(r => r.constructor.name)
      expect(relationTypes).toContain("Include")
      expect(relationTypes).toContain("Extend")
      expect(relationTypes).toContain("Generalize")
    })
  })
})
