import { describe, test, expect } from "bun:test"
import { TypeDiagram, UMLPlugin, DefaultTheme } from "../src/index"

describe("Actor Symbol Options", () => {
  test("should accept label as string (backward compatibility)", () => {
    const diagram = TypeDiagram("Test")
      .use(UMLPlugin)
      .theme(DefaultTheme)
      .layout(({ el }) => {
        const actor = el.uml.actor("User")
        expect(actor.id).toBeDefined()
      })

    expect(diagram).toBeDefined()
  })

  test("should accept options object with label only", () => {
    const diagram = TypeDiagram("Test")
      .use(UMLPlugin)
      .theme(DefaultTheme)
      .layout(({ el }) => {
        const actor = el.uml.actor({ label: "User" })
        expect(actor.id).toBeDefined()
      })

    expect(diagram).toBeDefined()
  })

  test("should accept options object with label and stereotype", () => {
    const diagram = TypeDiagram("Test")
      .use(UMLPlugin)
      .theme(DefaultTheme)
      .layout(({ el }) => {
        const actor = el.uml.actor({ label: "Admin", stereotype: "primary" })
        expect(actor.id).toBeDefined()
      })

    expect(diagram).toBeDefined()
  })

  test("should render stereotype in SVG output", () => {
    TypeDiagram("Test")
      .use(UMLPlugin)
      .theme(DefaultTheme)
      .layout(({ el }) => {
        const actor = el.uml.actor({ label: "Admin", stereotype: "primary" })
        const symbol = (el as any).__symbols?.symbols?.get(actor.id)
        if (symbol) {
          const svg = symbol.toSVG()
          expect(svg).toContain("&lt;&lt;primary&gt;&gt;")
        }
      })
  })

  test("should escape XML special characters in stereotype", () => {
    TypeDiagram("Test")
      .use(UMLPlugin)
      .theme(DefaultTheme)
      .layout(({ el }) => {
        const actor = el.uml.actor({ label: "User", stereotype: "<script>alert('xss')</script>" })
        const symbol = (el as any).__symbols?.symbols?.get(actor.id)
        if (symbol) {
          const svg = symbol.toSVG()
          expect(svg).not.toContain("<script>")
          expect(svg).toContain("&lt;script&gt;")
        }
      })
  })

  test("should escape XML special characters in label", () => {
    TypeDiagram("Test")
      .use(UMLPlugin)
      .theme(DefaultTheme)
      .layout(({ el }) => {
        const actor = el.uml.actor("<User & Admin>")
        const symbol = (el as any).__symbols?.symbols?.get(actor.id)
        if (symbol) {
          const svg = symbol.toSVG()
          expect(svg).toContain("&lt;User &amp; Admin&gt;")
          expect(svg).not.toContain("<User & Admin>")
        }
      })
  })
})
