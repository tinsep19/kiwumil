import { TextSymbol } from "@/plugin/core"
import { DefaultTheme } from "@/theme"
import { LayoutVariables, LayoutSolver } from "@/layout"

describe("TextSymbol", () => {
  test("calculates default size from multiline text", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bound = vars.createBounds("core:text-0")
    const symbol = new TextSymbol({
      id: "core:text-0",
      layout: bound,
      info: "First line\nSecond line is longer",
      theme: DefaultTheme,
    })
    const size = symbol.getDefaultSize()

    expect(size.width).toBeGreaterThan(150)
    expect(size.height).toBeGreaterThan(DefaultTheme.defaultStyleSet.fontSize * 2)
  })

  test("renders tspans for each line including blanks", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bound = vars.createBounds("core:text-1")
    const symbol = new TextSymbol({
      id: "core:text-1",
      layout: bound,
      info: "Line A\n\nLine C",
      theme: DefaultTheme,
    })
    // Set up layout bounds
    const lb = symbol.layout
    const xHandle = solver.createHandle(lb.x).strong()
    const yHandle = solver.createHandle(lb.y).strong()
    const widthHandle = solver.createHandle(lb.width).strong()
    const heightHandle = solver.createHandle(lb.height).strong()
    xHandle.suggest(0)
    yHandle.suggest(0)
    widthHandle.suggest(200)
    heightHandle.suggest(100)
    solver.updateVariables()

    const svg = symbol.toSVG()

    expect(svg).toContain("<tspan")
    expect(svg).toContain("> </tspan>")
  })

  test("applies text info overrides", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bound = vars.createBounds("core:text-2")
    const symbol = new TextSymbol({
      id: "core:text-2",
      layout: bound,
      info: {
        label: "Align start",
        textAnchor: "start",
        textColor: "#ff0000",
        fontSize: 20,
        fontFamily: "Courier New",
      },
      theme: DefaultTheme,
    })
    // Set up layout bounds
    const lb = symbol.layout
    const xHandle = solver.createHandle(lb.x).strong()
    const yHandle = solver.createHandle(lb.y).strong()
    const widthHandle = solver.createHandle(lb.width).strong()
    const heightHandle = solver.createHandle(lb.height).strong()
    xHandle.suggest(0)
    yHandle.suggest(0)
    widthHandle.suggest(200)
    heightHandle.suggest(80)
    solver.updateVariables()

    const svg = symbol.toSVG()

    expect(svg).toContain('text-anchor="start"')
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).toContain('font-size="20"')
    expect(svg).toContain('font-family="Courier New"')
  })
})
