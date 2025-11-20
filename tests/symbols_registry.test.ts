// tests/symbols_registry.test.ts
import { SymbolsRegistry } from "../src/symbols/registry"
import { LayoutContext } from "../src/layout/layout_context"
import { SymbolBase } from "../src/model/symbol_base"
import { DefaultTheme } from "../src/core/theme"
import type { SymbolId, Point } from "../src/model/types"
import type { BoundsBuilder } from "../src/layout/bounds_builder"

// テスト用のダミーシンボルクラス
class DummySymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 100, height: 50 }
  }

  toSVG(): string {
    return `<rect x="${this.bounds?.x}" y="${this.bounds?.y}" width="${this.bounds?.width}" height="${this.bounds?.height}"/>`
  }

  getConnectionPoint(_from: Point): Point {
    return { x: this.bounds?.x || 0, y: this.bounds?.y || 0 }
  }
}

describe("SymbolsRegistry", () => {
  let registry: SymbolsRegistry
  let layoutContext: LayoutContext

  beforeEach(() => {
    layoutContext = new LayoutContext(DefaultTheme, (_id: SymbolId) => undefined)
    registry = new SymbolsRegistry(layoutContext)
  })

  test("register generates correct ID format", () => {
    const symbol1 = registry.register('core', 'rectangle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Rect1", layoutContext.vars)
    })

    const symbol2 = registry.register('core', 'rectangle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Rect2", layoutContext.vars)
    })

    // ID format: ${plugin}:${symbolName}/${index}
    expect(symbol1.id).toBe("core:rectangle/0")
    expect(symbol2.id).toBe("core:rectangle/1")
  })

  test("register increments counter globally", () => {
    const circle = registry.register('core', 'circle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Circle", layoutContext.vars)
    })

    const rectangle = registry.register('core', 'rectangle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Rectangle", layoutContext.vars)
    })

    const actor = registry.register('uml', 'actor', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Actor", layoutContext.vars)
    })

    // カウンタはグローバルに増加
    expect(circle.id).toBe("core:circle/0")
    expect(rectangle.id).toBe("core:rectangle/1")
    expect(actor.id).toBe("uml:actor/2")
  })

  test("BoundsBuilder creates LayoutVars with correct IDs", () => {
    const symbol = registry.register('core', 'rectangle', (id: SymbolId, boundsBuilder: BoundsBuilder) => {
      const bounds = boundsBuilder.createBase('layout')
      
      // LayoutVar の varId が正しく設定されている
      expect(bounds.x.varId).toBe("core:rectangle/0#layout.x")
      expect(bounds.y.varId).toBe("core:rectangle/0#layout.y")
      expect(bounds.width.varId).toBe("core:rectangle/0#layout.width")
      expect(bounds.height.varId).toBe("core:rectangle/0#layout.height")
      
      return new DummySymbol(id, "Rect", layoutContext.vars)
    })

    expect(symbol.id).toBe("core:rectangle/0")
  })

  test("BoundsBuilder creates LayoutBounds with derived variables", () => {
    const symbol = registry.register('core', 'rectangle', (id: SymbolId, boundsBuilder: BoundsBuilder) => {
      const bounds = boundsBuilder.createLayoutBound('layout')
      
      // Basic properties
      expect(bounds.x.varId).toBe("core:rectangle/0#layout.x")
      expect(bounds.y.varId).toBe("core:rectangle/0#layout.y")
      expect(bounds.width.varId).toBe("core:rectangle/0#layout.width")
      expect(bounds.height.varId).toBe("core:rectangle/0#layout.height")
      
      // Derived properties (lazy-created)
      expect(bounds.right.varId).toContain(".right")
      expect(bounds.bottom.varId).toContain(".bottom")
      expect(bounds.centerX.varId).toContain(".centerX")
      expect(bounds.centerY.varId).toContain(".centerY")
      
      return new DummySymbol(id, "Rect", layoutContext.vars)
    })

    expect(symbol.id).toBe("core:rectangle/0")
  })

  test("createSet creates multiple bounds with correct IDs", () => {
    const symbol = registry.register('uml', 'class', (id: SymbolId, boundsBuilder: BoundsBuilder) => {
      const boundsSet = boundsBuilder.createSet({
        header: 'layout',
        body: 'layout',
        footer: 'layout'
      })
      
      expect(boundsSet.header.x.varId).toBe("uml:class/0#header.x")
      expect(boundsSet.body.x.varId).toBe("uml:class/0#body.x")
      expect(boundsSet.footer.x.varId).toBe("uml:class/0#footer.x")
      
      return new DummySymbol(id, "Class", layoutContext.vars)
    })

    expect(symbol.id).toBe("uml:class/0")
  })

  test("get retrieves symbol by ID", () => {
    const symbol = registry.register('core', 'circle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Circle", layoutContext.vars)
    })

    const retrieved = registry.get("core:circle/0")
    expect(retrieved).toBe(symbol)
  })

  test("get returns undefined for non-existent ID", () => {
    const retrieved = registry.get("non:existent/999" as SymbolId)
    expect(retrieved).toBeUndefined()
  })

  test("list returns all registered symbols", () => {
    const symbol1 = registry.register('core', 'circle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Circle", layoutContext.vars)
    })

    const symbol2 = registry.register('core', 'rectangle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Rectangle", layoutContext.vars)
    })

    const list = registry.list()
    expect(list).toHaveLength(2)
    expect(list).toContain(symbol1)
    expect(list).toContain(symbol2)
  })

  test("count returns number of registered symbols", () => {
    expect(registry.count()).toBe(0)

    registry.register('core', 'circle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Circle", layoutContext.vars)
    })

    expect(registry.count()).toBe(1)

    registry.register('core', 'rectangle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Rectangle", layoutContext.vars)
    })

    expect(registry.count()).toBe(2)
  })

  test("remove deletes symbol by ID", () => {
    const symbol = registry.register('core', 'circle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Circle", layoutContext.vars)
    })

    expect(registry.count()).toBe(1)

    const removed = registry.remove(symbol.id)
    expect(removed).toBe(true)
    expect(registry.count()).toBe(0)
    expect(registry.get(symbol.id)).toBeUndefined()
  })

  test("remove returns false for non-existent ID", () => {
    const removed = registry.remove("non:existent/999" as SymbolId)
    expect(removed).toBe(false)
  })

  test("clear removes all symbols and resets counter", () => {
    registry.register('core', 'circle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Circle", layoutContext.vars)
    })

    registry.register('core', 'rectangle', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Rectangle", layoutContext.vars)
    })

    expect(registry.count()).toBe(2)

    registry.clear()

    expect(registry.count()).toBe(0)
    expect(registry.list()).toHaveLength(0)

    // カウンタがリセットされることを確認
    const symbol = registry.register('core', 'ellipse', (id: SymbolId, _bounds: BoundsBuilder) => {
      return new DummySymbol(id, "Ellipse", layoutContext.vars)
    })

    expect(symbol.id).toBe("core:ellipse/0")
  })

  test("factory receives correct symbolId and boundsBuilder", () => {
    let receivedId: SymbolId | undefined
    let receivedBuilder: BoundsBuilder | undefined

    registry.register('test', 'dummy', (id: SymbolId, boundsBuilder: BoundsBuilder) => {
      receivedId = id
      receivedBuilder = boundsBuilder
      return new DummySymbol(id, "Dummy", layoutContext.vars)
    })

    expect(receivedId).toBe("test:dummy/0")
    expect(receivedBuilder).toBeDefined()
    expect(typeof receivedBuilder?.createBase).toBe('function')
    expect(typeof receivedBuilder?.createLayoutBound).toBe('function')
    expect(typeof receivedBuilder?.createSet).toBe('function')
  })
})
