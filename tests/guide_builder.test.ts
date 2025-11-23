import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext } from "../src/layout/layout_context"
import { ActorSymbol } from "../src/plugin/uml/symbols/actor_symbol"
import { HintFactory } from "../src/dsl/hint_factory"
import { Symbols } from "../src/dsl/symbols"
import { DefaultTheme } from "../src/theme"

describe("GuideBuilder (refactored common implementation)", () => {
  let symbols: Symbols
  let layout: LayoutContext
  let hint: HintFactory

  beforeEach(() => {
    symbols = new Symbols()
    layout = new LayoutContext(DefaultTheme, (id) => symbols.findById(id))
    hint = new HintFactory(layout, symbols)
  })

  function createActor(id: string) {
    return symbols.register("test", "actor", (symbolId) => {
      const bound = layout.variables.createBound(symbolId)
      const actor = new ActorSymbol(symbolId, id, bound)
      return actor
    })
  }

  describe("GuideBuilderX", () => {
    test("alignLeft aligns symbols to the left edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideX(100)
      guide.alignLeft(a.id, b.id)

      layout.solveAndApply(symbols.getAll())

      expect(a.bounds.x).toBeCloseTo(100)
      expect(b.bounds.x).toBeCloseTo(100)
    })

    test("alignRight aligns symbols to the right edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideX(200)
      guide.alignRight(a.id, b.id)

      layout.solveAndApply(symbols.getAll())

      expect(a.bounds.x + a.bounds.width).toBeCloseTo(200)
      expect(b.bounds.x + b.bounds.width).toBeCloseTo(200)
    })

    test("alignCenter aligns symbols to the center", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideX(150)
      guide.alignCenter(a.id, b.id)

      layout.solveAndApply(symbols.getAll())

      expect(a.bounds.x + a.bounds.width / 2).toBeCloseTo(150)
      expect(b.bounds.x + b.bounds.width / 2).toBeCloseTo(150)
    })

    test("followLeft makes guide follow symbol's left edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      hint.arrangeHorizontal(a.id, b.id)
      const guide = hint.createGuideX()
      guide.followLeft(b.id).alignLeft(a.id)

      layout.solveAndApply(symbols.getAll())

      expect(a.bounds.x).toBeCloseTo(b.bounds.x)
    })

    test("arrange arranges symbols vertically for X-axis guide", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideX(100)
      guide.alignCenter(a.id, b.id).arrange()

      layout.solveAndApply(symbols.getAll())

      // Should be arranged vertically
      expect(b.bounds.y).toBeCloseTo(
        a.bounds.y + a.bounds.height + DefaultTheme.defaultStyleSet.verticalGap
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

      layout.solveAndApply(symbols.getAll())

      expect(a.bounds.y).toBeCloseTo(50)
      expect(b.bounds.y).toBeCloseTo(50)
    })

    test("alignBottom aligns symbols to the bottom edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideY(200)
      guide.alignBottom(a.id, b.id)

      layout.solveAndApply(symbols.getAll())

      expect(a.bounds.y + a.bounds.height).toBeCloseTo(200)
      expect(b.bounds.y + b.bounds.height).toBeCloseTo(200)
    })

    test("alignCenter aligns symbols to the center", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideY(100)
      guide.alignCenter(a.id, b.id)

      layout.solveAndApply(symbols.getAll())

      expect(a.bounds.y + a.bounds.height / 2).toBeCloseTo(100)
      expect(b.bounds.y + b.bounds.height / 2).toBeCloseTo(100)
    })

    test("followTop makes guide follow symbol's top edge", () => {
      const a = createActor("a")
      const b = createActor("b")

      hint.arrangeVertical(a.id, b.id)
      const guide = hint.createGuideY()
      guide.followTop(b.id).alignTop(a.id)

      layout.solveAndApply(symbols.getAll())

      expect(a.bounds.y).toBeCloseTo(b.bounds.y)
    })

    test("arrange arranges symbols horizontally for Y-axis guide", () => {
      const a = createActor("a")
      const b = createActor("b")

      const guide = hint.createGuideY(100)
      guide.alignCenter(a.id, b.id).arrange()

      layout.solveAndApply(symbols.getAll())

      // Should be arranged horizontally
      expect(b.bounds.x).toBeCloseTo(
        a.bounds.x + a.bounds.width + DefaultTheme.defaultStyleSet.horizontalGap
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

      layout.solveAndApply(symbols.getAll())
      expect(layout.valueOf(guide.x)).toBeCloseTo(100)
    })

    test("GuideBuilderY has y property", () => {
      const guide = hint.createGuideY(50)
      expect(guide.y).toBeDefined()

      layout.solveAndApply(symbols.getAll())
      expect(layout.valueOf(guide.y)).toBeCloseTo(50)
    })

    test("maintains original behavior from layout_solver.test.ts", () => {
      const a = createActor("top")
      const b = createActor("bottom")

      const guide = hint.createGuideY().alignTop(a.id).alignBottom(b.id).arrange()

      layout.solveAndApply(symbols.getAll())

      const guideValue = layout.valueOf(guide.y)
      expect(a.bounds.y).toBeCloseTo(guideValue)
      expect(b.bounds.y + b.bounds.height).toBeCloseTo(guideValue)
      expect(b.bounds.x).toBeCloseTo(
        a.bounds.x + a.bounds.width + DefaultTheme.defaultStyleSet.horizontalGap
      )
    })
  })
})
