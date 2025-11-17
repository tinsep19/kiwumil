import { TextSymbol } from "../src/plugin/core/symbols/text_symbol"
import { DefaultTheme } from "../src/core/theme"

describe("TextSymbol", () => {
  test("calculates default size from multiline text", () => {
    const symbol = new TextSymbol("core:text-0", "First line\nSecond line is longer")
    symbol.setTheme(DefaultTheme)

    const size = symbol.getDefaultSize()

    expect(size.width).toBeGreaterThan(150)
    expect(size.height).toBeGreaterThan(DefaultTheme.defaultStyleSet.fontSize * 2)
  })

  test("renders tspans for each line including blanks", () => {
    const symbol = new TextSymbol("core:text-1", "Line A\n\nLine C")
    symbol.setTheme(DefaultTheme)
    symbol.bounds = { x: 0, y: 0, width: 200, height: 100 }

    const svg = symbol.toSVG()

    expect(svg).toContain("<tspan")
    expect(svg).toContain("> </tspan>")
  })

  test("applies text info overrides", () => {
    const symbol = new TextSymbol("core:text-2", {
      label: "Align start",
      textAnchor: "start",
      textColor: "#ff0000",
      fontSize: 20,
      fontFamily: "Courier New",
    })
    symbol.setTheme(DefaultTheme)
    symbol.bounds = { x: 0, y: 0, width: 200, height: 80 }

    const svg = symbol.toSVG()

    expect(svg).toContain('text-anchor="start"')
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).toContain('font-size="20"')
    expect(svg).toContain('font-family="Courier New"')
  })
})
