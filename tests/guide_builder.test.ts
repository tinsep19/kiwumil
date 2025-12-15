import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { getBoundsValues } from "@/core"
import { ActorSymbol } from "@/plugin/uml"
import { HintFactory, Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"

describe("GuideBuilder (refactored common implementation)", () => {
  let symbols: Symbols
  let context: LayoutContext
  let hint: HintFactory
  const diagramContainerId = "__diagram__"

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
    symbols = new Symbols(context.variables)
    hint = new HintFactory({ context, symbols, diagramContainer: diagramContainerId })
  })

  function createActor(id: string) {
    return symbols.register("test", "actor", (symbolId, r) => {
      const bound = r.createBounds("layout", "layout")
      const actor = new ActorSymbol({
        id: symbolId,
        bounds: bound,
        label: id,
        theme: DefaultTheme,
      })
      r.setSymbol(actor)
      r.setCharacs({ id: symbolId, bounds: bound })
      r.setConstraint((builder) => {
        actor.ensureLayoutBounds(builder)
      })
      return r.build()
    }).symbol as ActorSymbol
  }

  describe("GuideBuilderX", () => {
    test("alignLeft aligns symbols to the left edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideX(100)
      guide.alignLeft(a.id, b.id)

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      expect(aBounds.x).toBeCloseTo(100)
      expect(bBounds.x).toBeCloseTo(100)
    })

    test("alignRight aligns symbols to the right edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideX(200)
      guide.alignRight(a.id, b.id)

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      expect(aBounds.x + aBounds.width).toBeCloseTo(200)
      expect(bBounds.x + bBounds.width).toBeCloseTo(200)
    })

    test("alignCenter aligns symbols to the center", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideX(150)
      guide.alignCenter(a.id, b.id)

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      expect(aBounds.x + aBounds.width / 2).toBeCloseTo(150)
      expect(bBounds.x + bBounds.width / 2).toBeCloseTo(150)
    })

    test("followLeft makes guide follow symbol's left edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      hint.arrangeHorizontal(a.id, b.id)
      const guide = hint.createGuideX()
      guide.followLeft(b.id).alignLeft(a.id)

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      expect(aBounds.x).toBeCloseTo(bBounds.x)
    })

    test("arrange arranges symbols vertically for X-axis guide", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideX(100)
      guide.alignCenter(a.id, b.id).arrange()

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      // Should be arranged vertically
      expect(bBounds.y).toBeCloseTo(
        aBounds.y + aBounds.height + DefaultTheme.defaultStyleSet.verticalGap
      )
    })

    test("throws error when using Y-axis methods on X-axis guide", () => {
      const guide = hint.createGuideX()

      expect(() => guide.alignTop(createActor("a").id)).toThrow(
        "GuideBuilderX.alignTop(): This method is only available for GuideBuilderY"
      )
    })

    test("throws error on multiple follow calls", () => {
      const a = createActor("a")
      const b = createActor("b")
      const guide = hint.createGuideX()

      guide.followLeft(a.id)

      expect(() => guide.followRight(b.id)).toThrow(
        "GuideBuilderX.followRight(): guide already follows another symbol"
      )
    })
  })

  describe("GuideBuilderY", () => {
    test("alignTop aligns symbols to the top edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideY(50)
      guide.alignTop(a.id, b.id)

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      expect(aBounds.y).toBeCloseTo(50)
      expect(bBounds.y).toBeCloseTo(50)
    })

    test("alignBottom aligns symbols to the bottom edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideY(200)
      guide.alignBottom(a.id, b.id)

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      expect(aBounds.y + aBounds.height).toBeCloseTo(200)
      expect(bBounds.y + bBounds.height).toBeCloseTo(200)
    })

    test("alignCenter aligns symbols to the center", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideY(100)
      guide.alignCenter(a.id, b.id)

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      expect(aBounds.y + aBounds.height / 2).toBeCloseTo(100)
      expect(bBounds.y + bBounds.height / 2).toBeCloseTo(100)
    })

    test("followTop makes guide follow symbol's top edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      hint.arrangeVertical(a.id, b.id)
      const guide = hint.createGuideY()
      guide.followTop(b.id).alignTop(a.id)

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      expect(aBounds.y).toBeCloseTo(bBounds.y)
    })

    test("arrange arranges symbols horizontally for Y-axis guide", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideY(100)
      guide.alignCenter(a.id, b.id).arrange()

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      // Should be arranged horizontally
      expect(bBounds.x).toBeCloseTo(
        aBounds.x + aBounds.width + DefaultTheme.defaultStyleSet.horizontalGap
      )
    })

    test("throws error when using X-axis methods on Y-axis guide", () => {
      const guide = hint.createGuideY()

      expect(() => guide.alignLeft(createActor("a").id)).toThrow(
        "GuideBuilderY.alignLeft(): This method is only available for GuideBuilderX"
      )
    })

    test("throws error on multiple follow calls", () => {
      const a = createActor("a")
      const b = createActor("b")
      const guide = hint.createGuideY()

      guide.followTop(a.id)

      expect(() => guide.followBottom(b.id)).toThrow(
        "GuideBuilderY.followBottom(): guide already follows another symbol"
      )
    })
  })

  describe("Interface compatibility", () => {
    test("GuideBuilderX has x property", () => {
      const guide = hint.createGuideX(100)
      expect(guide.x).toBeDefined()

      context.solveAndApply(symbols.getAllSymbols())
      expect(context.valueOf(guide.x)).toBeCloseTo(100)
    })

    test("GuideBuilderY has y property", () => {
      const guide = hint.createGuideY(50)
      expect(guide.y).toBeDefined()

      context.solveAndApply(symbols.getAllSymbols())
      expect(context.valueOf(guide.y)).toBeCloseTo(50)
    })

    test("maintains original behavior from layout_solver.test.ts", () => {
      const a = createActor("top")
      const b = createActor("bottom")

      const guide = hint.createGuideY().alignTop(a.id).alignBottom(b.id).arrange()

      context.solveAndApply(symbols.getAllSymbols())

      const aBounds = getBoundsValues(a.bounds)
      const bBounds = getBoundsValues(b.bounds)
      const guideValue = context.valueOf(guide.y)
      expect(aBounds.y).toBeCloseTo(guideValue)
      expect(bBounds.y + bBounds.height).toBeCloseTo(guideValue)
      expect(bBounds.x).toBeCloseTo(
        aBounds.x + aBounds.width + DefaultTheme.defaultStyleSet.horizontalGap
      )
    })
  })
})
