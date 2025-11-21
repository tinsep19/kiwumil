import { TextSymbol } from "../src/plugin/core/symbols/text_symbol"
import { DefaultTheme } from "../src/theme"
import { LayoutVariables } from "../src/layout/layout_variables"
import { LayoutSolver } from "../src/layout/kiwi"

describe("TextSymbol", () => {
  test("calculates default size from multiline text", () => {
    const symbol = new TextSymbol("core:text-0", "First line\nSecond line is longer")
    symbol.setTheme(DefaultTheme)

    const size = symbol.getDefaultSize()

    expect(size.width).toBeGreaterThan(150)
    expect(size.height).toBeGreaterThan(DefaultTheme.defaultStyleSet.fontSize * 2)
  })

  test("renders tspans for each line including blanks", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const symbol = new TextSymbol("core:text-1", "Line A\n\nLine C", vars)
    symbol.setTheme(DefaultTheme)
    
    // Set up layout bounds
    const lb = symbol.getLayoutBounds()
    solver.addEditVariable(lb.x, "strong")
    solver.addEditVariable(lb.y, "strong")
    solver.addEditVariable(lb.width, "strong")
    solver.addEditVariable(lb.height, "strong")
    
    solver.suggestValue(lb.x, 0)
    solver.suggestValue(lb.y, 0)
    solver.suggestValue(lb.width, 200)
    solver.suggestValue(lb.height, 100)
    solver.updateVariables()

    const svg = symbol.toSVG()

    expect(svg).toContain("<tspan")
    expect(svg).toContain("> </tspan>")
  })

  test("applies text info overrides", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const symbol = new TextSymbol("core:text-2", {
      label: "Align start",
      textAnchor: "start",
      textColor: "#ff0000",
      fontSize: 20,
      fontFamily: "Courier New",
    }, vars)
    symbol.setTheme(DefaultTheme)
    
    // Set up layout bounds
    const lb = symbol.getLayoutBounds()
    solver.addEditVariable(lb.x, "strong")
    solver.addEditVariable(lb.y, "strong")
    solver.addEditVariable(lb.width, "strong")
    solver.addEditVariable(lb.height, "strong")
    
    solver.suggestValue(lb.x, 0)
    solver.suggestValue(lb.y, 0)
    solver.suggestValue(lb.width, 200)
    solver.suggestValue(lb.height, 80)
    solver.updateVariables()

    const svg = symbol.toSVG()

    expect(svg).toContain('text-anchor="start"')
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).toContain('font-size="20"')
    expect(svg).toContain('font-family="Courier New"')
  })
})
