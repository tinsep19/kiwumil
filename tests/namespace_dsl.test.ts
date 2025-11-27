// tests/namespace_dsl.test.ts
import { TypeDiagram } from "../src/dsl/diagram_builder"
import { UMLPlugin } from "../src/plugin/uml/plugin"
import { CorePlugin } from "../src/plugin/core/plugin"

describe("Namespace-based DSL", () => {
  test("UML Plugin - Basic usage", () => {
    const diagram = TypeDiagram("UML Test")
      .use(UMLPlugin)
      .build((el, rel, hint) => {
        // Type check: el.uml should exist
        expect(el.uml).toBeDefined()

        // Create symbols
        const user = el.uml.actor("User")
        const login = el.uml.usecase("Login")
        const system = el.uml.systemBoundary("System")

        // Check ID format: namespace:symbolName/serial
        expect(user).toMatch(/^uml:actor\/\d+$/)
        expect(login).toMatch(/^uml:usecase\/\d+$/)
        expect(system).toMatch(/^uml:systemBoundary\/\d+$/)

        // Create relationships
        const rel1 = rel.uml.associate(user, login)
        const rel2 = rel.uml.include(login, system)

        // Check relationship ID format
        expect(rel1).toMatch(/^uml:association\/\d+$/)
        expect(rel2).toMatch(/^uml:include\/\d+$/)
      })

    expect(diagram.symbols.length).toBeGreaterThan(0)
    expect(diagram.relationships.length).toBeGreaterThan(0)
  })

  test("Core Plugin - Basic usage", () => {
    const diagram = TypeDiagram("Core Test")
      .use(CorePlugin)
      .build((el, rel, hint) => {
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
        expect(circle).toMatch(/^core:circle\/\d+$/)
        expect(rect).toMatch(/^core:rectangle\/\d+$/)
        expect(text).toMatch(/^core:text\/\d+$/)
        expect(styledText).toMatch(/^core:text\/\d+$/)
      })

    expect(diagram.symbols.length).toBeGreaterThan(0)
  })

  test("Multiple Plugins", () => {
    const diagram = TypeDiagram("Multi Plugin Test")
      .use(UMLPlugin, CorePlugin)
      .build((el, rel, hint) => {
        // Both namespaces should exist
        expect(el.uml).toBeDefined()
        expect(el.core).toBeDefined()

        // Can use both plugins
        const actor = el.uml.actor("Actor")
        const circle = el.core.circle("Circle")

        // IDs should have different namespaces
        expect(actor).toMatch(/^uml:/)
        expect(circle).toMatch(/^core:/)
      })

    expect(diagram.symbols.length).toBeGreaterThan(0)
  })

  test("ID uniqueness", () => {
    const diagram = TypeDiagram("ID Test")
      .use(UMLPlugin)
      .build((el, rel, hint) => {
        const ids = [
          el.uml.actor("User1"),
          el.uml.actor("User2"),
          el.uml.usecase("UC1"),
          el.uml.usecase("UC2"),
        ]

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
      .build((el, rel, hint) => {
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
      })
  })
})
