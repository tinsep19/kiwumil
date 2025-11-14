// tests/diagram_builder.test.ts
import { describe, test, expect, beforeEach } from "bun:test"
import { DiagramBuilder } from "../src/dsl/diagram_builder"
import { DefaultTheme, BlueTheme } from "../src/core/theme"
import { UMLPlugin } from "../src/plugin/uml/plugin"
import { CorePlugin } from "../src/plugin/core/plugin"

describe("DiagramBuilder", () => {
  let builder: DiagramBuilder<any>

  beforeEach(() => {
    builder = new DiagramBuilder("Test")
  })

  describe("Constructor", () => {
    test("should work with CorePlugin", () => {
      let circleCalled = false
      
      builder.use(CorePlugin).build((el) => {
        const circle = el.core.circle("Test Circle")
        circleCalled = true
        expect(circle).toBeDefined()
      })
      
      expect(circleCalled).toBe(true)
    })

    test("should have basic shapes available from CorePlugin", () => {
      const shapes: string[] = []
      
      builder.build((el) => {
        shapes.push(el.circle("Circle"))
        shapes.push(el.ellipse("Ellipse"))
        shapes.push(el.rectangle("Rectangle"))
        shapes.push(el.roundedRectangle("RoundedRect"))
      })
      
      expect(shapes).toHaveLength(4)
    })
  })

  describe("use()", () => {
    test("should load additional plugins", () => {
      let actorCalled = false
      
      builder
        .use(UMLPlugin)
        .build((el) => {
          const actor = el.actor("User")
          actorCalled = true
          expect(actor).toBeDefined()
        })
      
      expect(actorCalled).toBe(true)
    })

    test("should return builder for chaining", () => {
      const result = builder.use(UMLPlugin)
      expect(result).toBe(builder)
    })

    test("should allow multiple plugins", () => {
      const result = builder
        .use(UMLPlugin)
        .build((el) => {
          // Both CorePlugin and UMLPlugin symbols available
          el.circle("Circle")
          el.actor("Actor")
        })
      
      expect(result).toBeDefined()
    })
  })

  describe("theme()", () => {
    test("should set theme", () => {
      const result = builder
        .theme(BlueTheme)
        .build((el) => {
          el.circle("Circle")
        })
      
      // DiagramSymbol + 1 user symbol = 2
      expect(result.symbols).toHaveLength(2)
      expect(result.symbols[0].theme).toBe(BlueTheme)  // DiagramSymbol
      expect(result.symbols[1].theme).toBe(BlueTheme)  // Circle
    })

    test("should return builder for chaining", () => {
      const result = builder.theme(DefaultTheme)
      expect(result).toBe(builder)
    })

    test("should apply theme to all symbols", () => {
      const result = builder
        .theme(BlueTheme)
        .build((el) => {
          el.circle("Circle")
          el.rectangle("Rectangle")
          el.ellipse("Ellipse")
        })
      
      // DiagramSymbol + 3 user symbols = 4
      expect(result.symbols).toHaveLength(4)
      for (const symbol of result.symbols) {
        expect(symbol.theme).toBe(BlueTheme)
      }
    })
  })

  describe("build()", () => {
    test("should create symbols from callback", () => {
      const result = builder.build((el) => {
        el.circle("C1")
        el.rectangle("R1")
      })
      
      // DiagramSymbol + 2 user symbols = 3
      expect(result.symbols).toHaveLength(3)
      expect(result.symbols[0].label).toBe("Test")  // DiagramSymbol
      expect(result.symbols[1].label).toBe("C1")
      expect(result.symbols[2].label).toBe("R1")
    })

    test("should create relationships from callback", () => {
      const result = builder
        .use(UMLPlugin)
        .build((el, rel) => {
          const actor = el.actor("User")
          const usecase = el.usecase("Login")
          rel.associate(actor, usecase)
        })
      
      expect(result.relationships).toHaveLength(1)
    })

    test("should handle layout hints", () => {
      const result = builder.build((el, rel, hint) => {
        const c1 = el.circle("C1")
        const c2 = el.circle("C2")
        hint.arrangeHorizontal(c1, c2)
      })
      
      // DiagramSymbol + 2 user symbols = 3
      expect(result.symbols).toHaveLength(3)
      // Check that symbols have bounds (layout was calculated)
      expect(result.symbols[0].bounds).toBeDefined()
      expect(result.symbols[1].bounds).toBeDefined()
      expect(result.symbols[2].bounds).toBeDefined()
    })

    test("should return result with render function", () => {
      const result = builder.build((el) => {
        el.circle("Circle")
      })
      
      expect(result.render).toBeDefined()
      expect(typeof result.render).toBe("function")
    })

    test("should calculate layout automatically", () => {
      const result = builder.build((el, rel, hint) => {
        const c1 = el.circle("C1")
        const c2 = el.circle("C2")
        hint.arrangeHorizontal(c1, c2)
      })
      
      // [0] = DiagramSymbol, [1] = C1, [2] = C2
      const sym1 = result.symbols[1]
      const sym2 = result.symbols[2]
      
      // Second symbol should be to the right of first
      expect(sym2.bounds.x).toBeGreaterThan(sym1.bounds.x)
      // Y coordinates should be the same (horizontal arrangement)
      expect(sym2.bounds.y).toBe(sym1.bounds.y)
    })
  })

  describe("Method Chaining", () => {
    test("should support full chaining: use -> theme -> build", () => {
      const result = builder
        .use(UMLPlugin)
        .theme(BlueTheme)
        .build((el) => {
          el.actor("User")
          el.circle("Circle")
        })
      
      // DiagramSymbol + 2 user symbols = 3
      expect(result.symbols).toHaveLength(3)
      expect(result.symbols[0].theme).toBe(BlueTheme)  // DiagramSymbol
      expect(result.symbols[1].theme).toBe(BlueTheme)  // User
      expect(result.symbols[2].theme).toBe(BlueTheme)  // Circle
    })

    test("should support theme -> use -> build", () => {
      const result = builder
        .theme(DefaultTheme)
        .use(UMLPlugin)
        .build((el) => {
          el.usecase("Login")
        })
      
      // DiagramSymbol + 1 user symbol = 2
      expect(result.symbols).toHaveLength(2)
      expect(result.symbols[0].theme).toBe(DefaultTheme)  // DiagramSymbol
      expect(result.symbols[1].theme).toBe(DefaultTheme)  // Login
    })
  })

  describe("CorePlugin symbols", () => {
    test("should have circle available", () => {
      const result = builder.build((el) => {
        const id = el.circle("My Circle")
        expect(id).toContain("circle")
      })
      
      // result.symbols[0] = DiagramSymbol, [1] = Circle
      expect(result.symbols[1].label).toBe("My Circle")
    })

    test("should have ellipse available", () => {
      const result = builder.build((el) => {
        const id = el.ellipse("My Ellipse")
        expect(id).toContain("ellipse")
      })
      
      // result.symbols[0] = DiagramSymbol, [1] = Ellipse
      expect(result.symbols[1].label).toBe("My Ellipse")
    })

    test("should have rectangle available", () => {
      const result = builder.build((el) => {
        const id = el.rectangle("My Rectangle")
        expect(id).toContain("rectangle")
      })
      
      // result.symbols[0] = DiagramSymbol, [1] = Rectangle
      expect(result.symbols[1].label).toBe("My Rectangle")
    })

    test("should have roundedRectangle available", () => {
      const result = builder.build((el) => {
        const id = el.roundedRectangle("My RoundedRect")
        expect(id).toContain("roundedRectangle")
      })
      
      // result.symbols[0] = DiagramSymbol, [1] = RoundedRectangle
      expect(result.symbols[1].label).toBe("My RoundedRect")
    })
  })

  describe("Integration", () => {
    test("should work with multiple symbols and layout hints", () => {
      const result = builder
        .theme(BlueTheme)
        .build((el, rel, hint) => {
          const circle = el.circle("Circle")
          const rect = el.rectangle("Rectangle")
          const ellipse = el.ellipse("Ellipse")
          
          hint.arrangeHorizontal(circle, rect, ellipse)
          hint.alignCenterY(circle, rect, ellipse)
        })
      
      // DiagramSymbol + 3 user symbols = 4
      expect(result.symbols).toHaveLength(4)
      
      // Check horizontal arrangement (skip DiagramSymbol at [0])
      expect(result.symbols[2].bounds.x).toBeGreaterThan(result.symbols[1].bounds.x)
      expect(result.symbols[3].bounds.x).toBeGreaterThan(result.symbols[2].bounds.x)
      
      // Check Y alignment (user symbols at [1], [2], [3])
      const y1 = result.symbols[1].bounds.y
      expect(result.symbols[2].bounds.y).toBe(y1)
      expect(result.symbols[3].bounds.y).toBe(y1)
    })

    test("should work with UMLPlugin and CorePlugin together", () => {
      const result = builder
        .use(UMLPlugin)
        .build((el, rel, hint) => {
          const actor = el.actor("User")
          const circle = el.circle("Circle")
          const usecase = el.usecase("Action")
          
          rel.associate(actor, usecase)
          hint.arrangeHorizontal(actor, circle, usecase)
        })
      
      // DiagramSymbol + 3 user symbols = 4
      expect(result.symbols).toHaveLength(4)
      expect(result.relationships).toHaveLength(1)
    })

    test("should generate valid bounds for all symbols", () => {
      const result = builder.build((el, rel, hint) => {
        const shapes = [
          el.circle("C"),
          el.ellipse("E"),
          el.rectangle("R"),
          el.roundedRectangle("RR")
        ]
        
        hint.arrangeHorizontal(...shapes)
      })
      
      for (const symbol of result.symbols) {
        expect(symbol.bounds).toBeDefined()
        expect(symbol.bounds.x).toBeGreaterThanOrEqual(0)
        expect(symbol.bounds.y).toBeGreaterThanOrEqual(0)
        expect(symbol.bounds.width).toBeGreaterThan(0)
        expect(symbol.bounds.height).toBeGreaterThan(0)
      }
    })
  })

  describe("Edge Cases", () => {
    test("should handle empty diagram", () => {
      const result = builder.build(() => {
        // No symbols
      })
      
      // Only DiagramSymbol when no user symbols
      expect(result.symbols).toHaveLength(1)
      expect(result.symbols[0].label).toBe("Test")  // DiagramSymbol
      expect(result.relationships).toHaveLength(0)
    })

    test("should handle diagram with only one symbol", () => {
      const result = builder.build((el) => {
        el.circle("Lonely")
      })
      
      // DiagramSymbol + 1 user symbol = 2
      expect(result.symbols).toHaveLength(2)
      expect(result.symbols[0].bounds).toBeDefined()
      expect(result.symbols[1].bounds).toBeDefined()
    })

    test("should have default theme applied", () => {
      const result = builder.build((el) => {
        el.circle("Circle")
      })
      
      // DiagramSymbol + 1 user symbol = 2
      expect(result.symbols).toHaveLength(2)
      // DefaultTheme should be applied automatically
      expect(result.symbols[0].theme).toBeDefined()
      expect(result.symbols[0].theme?.name).toBe("default")
      expect(result.symbols[1].theme).toBeDefined()
      expect(result.symbols[1].theme?.name).toBe("default")
    })
  })
})
