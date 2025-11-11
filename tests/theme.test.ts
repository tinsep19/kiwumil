// tests/theme.test.ts
import { describe, test, expect } from "bun:test"
import { DefaultTheme, BlueTheme, DarkTheme, getStyleForSymbol } from "../src/core/theme"
import type { Theme } from "../src/core/theme"

describe("Theme System", () => {
  describe("DefaultTheme", () => {
    test("should have correct name", () => {
      expect(DefaultTheme.name).toBe("default")
    })

    test("should have default style set", () => {
      expect(DefaultTheme.defaultStyleSet).toEqual({
        textColor: "black",
        fontSize: 12,
        fontFamily: "Arial",
        strokeWidth: 2,
        strokeColor: "black",
        fillColor: "white",
        backgroundColor: "white",
        horizontalGap: 80,
        verticalGap: 50
      })
    })

    test("should have symbol-specific styles", () => {
      expect(DefaultTheme.symbols?.actor).toBeDefined()
      expect(DefaultTheme.symbols?.usecase).toBeDefined()
      expect(DefaultTheme.symbols?.systemBoundary).toBeDefined()
    })

    test("should have systemBoundary with custom fillColor", () => {
      expect(DefaultTheme.symbols?.systemBoundary?.fillColor).toBe("#f8f8f8")
      expect(DefaultTheme.symbols?.systemBoundary?.strokeColor).toBe("#999")
    })
  })

  describe("BlueTheme", () => {
    test("should have correct name", () => {
      expect(BlueTheme.name).toBe("blue")
    })

    test("should have blue color scheme", () => {
      expect(BlueTheme.defaultStyleSet.strokeColor).toBe("#0066cc")
      expect(BlueTheme.defaultStyleSet.fillColor).toBe("#e6f3ff")
      expect(BlueTheme.defaultStyleSet.textColor).toBe("#003366")
    })

    test("should have consistent blue theme for all symbols", () => {
      expect(BlueTheme.symbols?.actor?.strokeColor).toBe("#003366")
      expect(BlueTheme.symbols?.usecase?.fillColor).toBe("#e6f3ff")
      expect(BlueTheme.symbols?.systemBoundary?.strokeColor).toBe("#0066cc")
    })
  })

  describe("DarkTheme", () => {
    test("should have correct name", () => {
      expect(DarkTheme.name).toBe("dark")
    })

    test("should have dark color scheme", () => {
      expect(DarkTheme.defaultStyleSet.backgroundColor).toBe("#1e1e1e")
      expect(DarkTheme.defaultStyleSet.fillColor).toBe("#2d2d2d")
      expect(DarkTheme.defaultStyleSet.textColor).toBe("#d4d4d4")
    })

    test("should have dark-friendly colors for symbols", () => {
      expect(DarkTheme.symbols?.actor?.strokeColor).toBe("#4ec9b0")
      expect(DarkTheme.symbols?.usecase?.fillColor).toBe("#2d2d2d")
      expect(DarkTheme.symbols?.systemBoundary?.strokeColor).toBe("#808080")
    })
  })

  describe("getStyleForSymbol", () => {
    test("should return default style when symbol not defined", () => {
      const style = getStyleForSymbol(DefaultTheme, "unknownSymbol")
      
      expect(style.textColor).toBe(DefaultTheme.defaultStyleSet.textColor)
      expect(style.fontSize).toBe(DefaultTheme.defaultStyleSet.fontSize)
      expect(style.strokeWidth).toBe(DefaultTheme.defaultStyleSet.strokeWidth)
      expect(style.strokeColor).toBe(DefaultTheme.defaultStyleSet.strokeColor)
      expect(style.fillColor).toBe(DefaultTheme.defaultStyleSet.fillColor)
      expect(style.backgroundColor).toBe(DefaultTheme.defaultStyleSet.backgroundColor)
    })

    test("should merge symbol style with defaults", () => {
      const style = getStyleForSymbol(DefaultTheme, "systemBoundary")
      
      // Override from symbol
      expect(style.fillColor).toBe("#f8f8f8")
      expect(style.strokeColor).toBe("#999")
      
      // Fallback to default
      expect(style.textColor).toBe(DefaultTheme.defaultStyleSet.textColor)
      expect(style.fontSize).toBe(14) // systemBoundary has custom fontSize
    })

    test("should handle partial symbol style override", () => {
      const customTheme: Theme = {
        name: "custom",
        defaultStyleSet: {
          textColor: "black",
          fontSize: 12,
          strokeWidth: 2,
          strokeColor: "black",
          fillColor: "white"
        },
        symbols: {
          actor: {
            strokeColor: "red" // Only override strokeColor
          }
        }
      }

      const style = getStyleForSymbol(customTheme, "actor")
      
      expect(style.strokeColor).toBe("red")
      expect(style.textColor).toBe("black") // From default
      expect(style.fontSize).toBe(12) // From default
    })

    test("should return complete StyleSet for each theme's symbols", () => {
      const themes = [DefaultTheme, BlueTheme, DarkTheme]
      const symbolNames = ["actor", "usecase", "systemBoundary"]

      for (const theme of themes) {
        for (const symbolName of symbolNames) {
          const style = getStyleForSymbol(theme, symbolName)
          
          expect(style.textColor).toBeDefined()
          expect(style.fontSize).toBeDefined()
          expect(style.strokeWidth).toBeDefined()
          expect(style.strokeColor).toBeDefined()
          expect(style.fillColor).toBeDefined()
          // backgroundColor is optional
        }
      }
    })
  })

  describe("Custom Theme", () => {
    test("should allow creating custom theme", () => {
      const customTheme: Theme = {
        name: "custom",
        defaultStyleSet: {
          textColor: "#333333",
          fontSize: 14,
          strokeWidth: 2.5,
          strokeColor: "#ff6600",
          fillColor: "#fff5e6",
          backgroundColor: "#ffffff"
        },
        symbols: {
          actor: {
            strokeColor: "#ff3300",
            strokeWidth: 3
          }
        }
      }

      expect(customTheme.name).toBe("custom")
      expect(customTheme.defaultStyleSet.strokeColor).toBe("#ff6600")
    })

    test("should work with getStyleForSymbol", () => {
      const customTheme: Theme = {
        name: "custom",
        defaultStyleSet: {
          textColor: "purple",
          fontSize: 16,
          strokeWidth: 3,
          strokeColor: "purple",
          fillColor: "lavender"
        },
        symbols: {
          myCustomSymbol: {
            fillColor: "pink"
          }
        }
      }

      const style = getStyleForSymbol(customTheme, "myCustomSymbol")
      
      expect(style.fillColor).toBe("pink")
      expect(style.textColor).toBe("purple")
      expect(style.fontSize).toBe(16)
    })
  })

  describe("Theme Consistency", () => {
    test("all themes should have required properties", () => {
      const themes = [DefaultTheme, BlueTheme, DarkTheme]

      for (const theme of themes) {
        expect(theme.name).toBeDefined()
        expect(theme.defaultStyleSet).toBeDefined()
        expect(theme.defaultStyleSet.textColor).toBeDefined()
        expect(theme.defaultStyleSet.fontSize).toBeDefined()
        expect(theme.defaultStyleSet.strokeWidth).toBeDefined()
        expect(theme.defaultStyleSet.strokeColor).toBeDefined()
        expect(theme.defaultStyleSet.fillColor).toBeDefined()
      }
    })

    test("all themes should have core symbol definitions", () => {
      const themes = [DefaultTheme, BlueTheme, DarkTheme]
      const coreSymbols = ["actor", "usecase", "systemBoundary"]

      for (const theme of themes) {
        for (const symbol of coreSymbols) {
          expect(theme.symbols?.[symbol]).toBeDefined()
        }
      }
    })

    test("theme names should be unique", () => {
      const names = [DefaultTheme.name, BlueTheme.name, DarkTheme.name]
      const uniqueNames = new Set(names)
      
      expect(uniqueNames.size).toBe(names.length)
    })
  })

  describe("Theme Integration", () => {
    test("should work with symbol rendering", () => {
      // Simulate how symbols use themes
      const symbolName = "actor"
      const theme = BlueTheme

      const style = getStyleForSymbol(theme, symbolName)
      
      // Check that we can construct SVG attributes from style
      expect(typeof style.strokeColor).toBe("string")
      expect(typeof style.fillColor).toBe("string")
      expect(typeof style.textColor).toBe("string")
      expect(typeof style.strokeWidth).toBe("number")
      expect(typeof style.fontSize).toBe("number")
    })

    test("should handle missing symbol definition gracefully", () => {
      const style = getStyleForSymbol(BlueTheme, "nonExistentSymbol")
      
      // Should fall back to default style
      expect(style.textColor).toBe(BlueTheme.defaultStyleSet.textColor)
      expect(style.fillColor).toBe(BlueTheme.defaultStyleSet.fillColor)
    })
  })

  describe("Color Values", () => {
    test("DefaultTheme should use standard colors", () => {
      expect(DefaultTheme.defaultStyleSet.textColor).toBe("black")
      expect(DefaultTheme.defaultStyleSet.fillColor).toBe("white")
      expect(DefaultTheme.defaultStyleSet.strokeColor).toBe("black")
    })

    test("BlueTheme should use hex colors", () => {
      expect(BlueTheme.defaultStyleSet.strokeColor).toMatch(/^#[0-9a-f]{6}$/i)
      expect(BlueTheme.defaultStyleSet.fillColor).toMatch(/^#[0-9a-f]{6}$/i)
      expect(BlueTheme.defaultStyleSet.textColor).toMatch(/^#[0-9a-f]{6}$/i)
    })

    test("DarkTheme should use hex colors", () => {
      expect(DarkTheme.defaultStyleSet.strokeColor).toMatch(/^#[0-9a-f]{6}$/i)
      expect(DarkTheme.defaultStyleSet.fillColor).toMatch(/^#[0-9a-f]{6}$/i)
      expect(DarkTheme.defaultStyleSet.backgroundColor).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})
