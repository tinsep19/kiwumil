// tests/uml_relationships.test.ts
import { describe, test, expect } from "bun:test"
import { TypeDiagram } from "../src/dsl/diagram_builder"
import { UMLPlugin } from "../src/plugin/uml/plugin"

describe("UML Relationships", () => {
  describe("Include Relationship", () => {
    test("should create include relationship between use cases", () => {
      TypeDiagram("Test Diagram").use(UMLPlugin)

      const result = TypeDiagram("Test Diagram")
        .use(UMLPlugin)
        .build((el, rel) => {
          const usecaseA = el.uml.usecase("UseCase A")
          const usecaseB = el.uml.usecase("UseCase B")
          rel.uml.include(usecaseA, usecaseB)
        })

      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].constructor.name).toBe("Include")
    })

    test("should generate SVG with dashed line and stereotype", () => {
      TypeDiagram("Test Diagram").use(UMLPlugin)

      const result = TypeDiagram("Test Diagram")
        .use(UMLPlugin)
        .build((el, rel, hint) => {
          const usecaseA = el.uml.usecase("UseCase A")
          const usecaseB = el.uml.usecase("UseCase B")
          rel.uml.include(usecaseA, usecaseB)
          hint.horizontal(usecaseA, usecaseB)
        })

      const svg = result.relationships[0].toSVG(new Map(result.symbols.map((s) => [s.id, s])))

      expect(svg).toContain("stroke-dasharray")
      expect(svg).toContain("«include»")
    })
  })

  describe("Extend Relationship", () => {
    test("should create extend relationship between use cases", () => {
      TypeDiagram("Test Diagram").use(UMLPlugin)

      const result = TypeDiagram("Test Diagram")
        .use(UMLPlugin)
        .build((el, rel) => {
          const usecaseA = el.uml.usecase("UseCase A")
          const usecaseB = el.uml.usecase("UseCase B")
          rel.uml.extend(usecaseA, usecaseB)
        })

      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].constructor.name).toBe("Extend")
    })

    test("should generate SVG with dashed line and stereotype", () => {
      TypeDiagram("Test Diagram").use(UMLPlugin)

      const result = TypeDiagram("Test Diagram")
        .use(UMLPlugin)
        .build((el, rel, hint) => {
          const usecaseA = el.uml.usecase("UseCase A")
          const usecaseB = el.uml.usecase("UseCase B")
          rel.uml.extend(usecaseA, usecaseB)
          hint.horizontal(usecaseA, usecaseB)
        })

      const svg = result.relationships[0].toSVG(new Map(result.symbols.map((s) => [s.id, s])))

      expect(svg).toContain("stroke-dasharray")
      expect(svg).toContain("«extend»")
    })
  })

  describe("Generalize Relationship", () => {
    test("should create generalization relationship between use cases", () => {
      TypeDiagram("Test Diagram").use(UMLPlugin)

      const result = TypeDiagram("Test Diagram")
        .use(UMLPlugin)
        .build((el, rel) => {
          const usecaseA = el.uml.usecase("UseCase A")
          const usecaseB = el.uml.usecase("UseCase B")
          rel.uml.generalize(usecaseA, usecaseB)
        })

      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].constructor.name).toBe("Generalize")
    })

    test("should generate SVG with solid line and triangle", () => {
      TypeDiagram("Test Diagram").use(UMLPlugin)

      const result = TypeDiagram("Test Diagram")
        .use(UMLPlugin)
        .build((el, rel, hint) => {
          const usecaseA = el.uml.usecase("UseCase A")
          const usecaseB = el.uml.usecase("UseCase B")
          rel.uml.generalize(usecaseA, usecaseB)
          hint.horizontal(usecaseA, usecaseB)
        })

      const svg = result.relationships[0].toSVG(new Map(result.symbols.map((s) => [s.id, s])))

      expect(svg).toContain("polygon")
      expect(svg).toContain("fill")
    })
  })

  describe("Combined Relationships", () => {
    test("should support multiple relationship types in same diagram", () => {
      TypeDiagram("Test Diagram").use(UMLPlugin)

      const result = TypeDiagram("Test Diagram")
        .use(UMLPlugin)
        .build((el, rel, hint) => {
          const usecaseA = el.uml.usecase("UseCase A")
          const usecaseB = el.uml.usecase("UseCase B")
          const usecaseC = el.uml.usecase("UseCase C")

          rel.uml.include(usecaseA, usecaseB)
          rel.uml.extend(usecaseB, usecaseC)
          rel.uml.generalize(usecaseC, usecaseA)

          hint.vertical(usecaseA, usecaseB)
          hint.horizontal(usecaseB, usecaseC)
        })

      expect(result.relationships).toHaveLength(3)
      // DiagramSymbol + 3 use cases = 4
      expect(result.symbols).toHaveLength(4)

      const relationTypes = result.relationships.map((r) => r.constructor.name)
      expect(relationTypes).toContain("Include")
      expect(relationTypes).toContain("Extend")
      expect(relationTypes).toContain("Generalize")
    })
  })
})
