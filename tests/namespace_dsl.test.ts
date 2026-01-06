// tests/namespace_dsl.test.ts
import { TypeDiagram } from "@/dsl"
import { UMLPlugin } from "@/plugin/uml"
import { CorePlugin } from "@/plugin/core"

describe("Namespace-based DSL", () => {
  test("UML Plugin - Basic usage", () => {
    const diagram = TypeDiagram("UML Test")
      .use(UMLPlugin)
      .layout(({ el, rel, hint, diagram: diagramCharacs }) => {
        // Type check: el.uml should exist
        expect(el.uml).toBeDefined()

        // Create symbols
        const user = el.uml.actor("User")
        const login = el.uml.usecase("Login")
        const system = el.uml.systemBoundary("System")

        // Check ID format: namespace:symbolName/serial
        expect(user.id).toMatch(/^uml:actor\/\d+$/)
        expect(login.id).toMatch(/^uml:usecase\/\d+$/)
        expect(system.id).toMatch(/^uml:systemBoundary\/\d+$/)

        // Create relationships
        const rel1 = rel.uml.associate(user, login)
        const rel2 = rel.uml.include(login, system)

        // Check relationship ID format
        expect(rel1).toMatch(/^uml:association\/\d+$/)
        expect(rel2).toMatch(/^uml:include\/\d+$/)
        
        hint.enclose(diagramCharacs, [user, login, system])
      })

    expect(diagram.symbols.length).toBeGreaterThan(0)
    expect(diagram.relationships.length).toBeGreaterThan(0)
  })

  test("Core Plugin - Basic usage", () => {
    const diagram = TypeDiagram("Core Test")
      .use(CorePlugin)
      .layout(({ el, rel, hint, diagram: diagramCharacs }) => {
        // Type check: el.core should exist
        expect(el.core).toBeDefined()

        // Create symbols
        const circle = el.core.circle("Circle")
        const rect = el.core.rectangle("Rectangle")
        const text = el.core.text("Line 1\nLine 2")
        const styledText = el.core.text({
          label: "Styled text",
          textAnchor: "start",
          textColor: "#ff00ff",
        })

        // Check ID format
        expect(circle.id).toMatch(/^core:circle\/\d+$/)
        expect(rect.id).toMatch(/^core:rectangle\/\d+$/)
        expect(text.id).toMatch(/^core:text\/\d+$/)
        expect(styledText.id).toMatch(/^core:text\/\d+$/)
        
        hint.enclose(diagramCharacs, [circle, rect, text, styledText])
      })

    expect(diagram.symbols.length).toBeGreaterThan(0)
  })

  test("Multiple Plugins", () => {
    const diagram = TypeDiagram("Multi Plugin Test")
      .use(UMLPlugin, CorePlugin)
      .layout(({ el, rel, hint, diagram: diagramCharacs }) => {
        // Both namespaces should exist
        expect(el.uml).toBeDefined()
        expect(el.core).toBeDefined()

        // Can use both plugins
        const actor = el.uml.actor("Actor")
        const circle = el.core.circle("Circle")

        // IDs should have different namespaces
        expect(actor.id).toMatch(/^uml:/)
        expect(circle.id).toMatch(/^core:/)
        
        hint.enclose(diagramCharacs, [actor, circle])
      })

    expect(diagram.symbols.length).toBeGreaterThan(0)
  })

  test("ID uniqueness", () => {
    const diagram = TypeDiagram("ID Test")
      .use(UMLPlugin)
      .layout(({ el, rel, hint, diagram: diagramCharacs }) => {
        const ids = [
          el.uml.actor("User1"),
          el.uml.actor("User2"),
          el.uml.usecase("UC1"),
          el.uml.usecase("UC2"),
        ].map((symbol) => symbol.id)

        // All IDs should be unique
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)

        // All IDs should start with the UML namespace and end with a counter
        ids.forEach((id) => expect(id).toMatch(/^uml:(actor|usecase)\/\d+$/))
      })
  })

  test("Relationship ID uniqueness", () => {
    const diagram = TypeDiagram("Relationship ID Test")
      .use(UMLPlugin)
      .layout(({ el, rel, hint, diagram: diagramCharacs }) => {
        const user = el.uml.actor("User")
        const uc1 = el.uml.usecase("UC1")
        const uc2 = el.uml.usecase("UC2")

        const relIds = [
          rel.uml.associate(user, uc1),
          rel.uml.associate(user, uc2),
          rel.uml.include(uc1, uc2),
        ]

        // All relationship IDs should be unique
        const uniqueIds = new Set(relIds)
        expect(uniqueIds.size).toBe(relIds.length)

        // Check format and sequential numbering
        expect(relIds[0]).toBe("uml:association/0")
        expect(relIds[1]).toBe("uml:association/1")
        expect(relIds[2]).toBe("uml:include/2")
        
        hint.enclose(diagramCharacs, [user, uc1, uc2])
      })
  })
})
