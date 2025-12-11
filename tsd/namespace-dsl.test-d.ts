import { expectAssignable, expectType } from "tsd"
import {
  TypeDiagram,
  UMLPlugin,
  type DiagramPlugin,
  type SymbolId,
  type RelationshipId,
} from "../dist"
import { SymbolBase } from "../dist/model/symbol_base"
import {
  RelationshipBase,
  type RelationshipBaseOptions,
} from "../dist/model/relationship_base"
import type { LayoutBounds, IConstraintsBuilder, ISymbolCharacs } from "../dist/core"
import { DefaultTheme } from "../dist/theme"
import type { Theme } from "../dist/theme"
import {
  toSymbolId,
  type SymbolOrId,
} from "../dist/dsl/symbol_helpers"

class TestSymbol extends SymbolBase {
  readonly label: string

  constructor(id: SymbolId, label: string, layout: LayoutBounds) {
    super({ id, layout, theme: DefaultTheme })
    this.label = label
  }

  getDefaultSize() {
    return { width: 0, height: 0 }
  }

  toSVG() {
    return ""
  }

  getConnectionPoint() {
    return { x: 0, y: 0 }
  }

  ensureLayoutBounds(_builder: IConstraintsBuilder): void {
    // no-op for testing
  }
}

class TestRelationship extends RelationshipBase {
  constructor(options: RelationshipBaseOptions) {
    super(options)
  }

  toSVG() {
    return ""
  }
}

const CustomPlugin = {
  name: "custom",
  createSymbolFactory(symbols, _theme: Theme, _icons: Record<string, () => import("../src/icon").IconMeta | null>) {
    const plugin = this.name

    return {
      node(label: string) {
        return symbols.register(plugin, "node", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const testSymbol = new TestSymbol(symbolId, label, bound)
          r.setSymbol(testSymbol)
          r.setCharacs({ id: symbolId, layout: bound })
          r.setConstraint((builder) => {
            testSymbol.ensureLayoutBounds(builder)
          })
          return r.build()
        }).characs
      },
    }
  },
  createRelationshipFactory(relationships, _theme: Theme, _icons: Record<string, () => import("../src/icon").IconMeta | null>) {
    const plugin = this.name

    return {
      link(from: SymbolOrId, to: SymbolOrId): RelationshipId {
        const relationship = relationships.register(
          plugin,
          "link",
          (id) =>
            new TestRelationship({
              id,
              from: toSymbolId(from),
              to: toSymbolId(to),
              theme: _theme,
            })
        )
        return relationship.id
      }
    }
  }
} as const satisfies DiagramPlugin

TypeDiagram("Default Core").build(({ el, rel }) => {
  const _core = el.core
  expectAssignable<object>(_core)
  expectType<ISymbolCharacs>(el.core.circle("Circle"))
  expectType<ISymbolCharacs>(el.core.text("Multi\nLine"))
  expectType<ISymbolCharacs>(el.core.text({ label: "Info object", textAnchor: "start" }))

  // @ts-expect-error - UMLPlugin not registered yet
  const _uml = el.uml

  // @ts-expect-error - Core plugin does not expose relationships
  const _relCore = rel.core

  void _uml
  void _relCore
})

TypeDiagram("UML Plugin")
  .use(UMLPlugin)
  .build(({ el, rel }) => {
    const _uml = el.uml
    expectAssignable<object>(_uml)

    const user = el.uml.actor("User")
    expectType<ISymbolCharacs>(user)
    const boundary = el.uml.systemBoundary("System")
    expectType<ISymbolCharacs>(boundary)

    const _relUml = rel.uml
    expectAssignable<object>(_relUml)

    void _relUml
  })

TypeDiagram("Multiple Plugins")
  .use(UMLPlugin)
  .use(CustomPlugin)
  .build(({ el, rel }) => {
    const _uml = el.uml
    expectAssignable<object>(_uml)

    const _custom = el.custom
    expectAssignable<object>(_custom)

    const user = el.uml.actor("User")
    const node = el.custom.node("Node")
    expectType<ISymbolCharacs>(user)
    expectType<ISymbolCharacs>(node)

    const link = rel.custom.link(user, node)
    expectType<RelationshipId>(link)

    void rel
  })
