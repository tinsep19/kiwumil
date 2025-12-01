import { expectAssignable, expectType } from "tsd"
import {
  TypeDiagram,
  UMLPlugin,
  type DiagramPlugin,
  type SymbolId,
  type RelationshipId,
} from "@tinsep19/kiwumil"
import { SymbolBase } from "@tinsep19/kiwumil/model/symbol_base"
import {
  RelationshipBase,
  type RelationshipBaseOptions,
} from "@tinsep19/kiwumil/model/relationship_base"
import type { LayoutBounds } from "@tinsep19/kiwumil/layout/bounds"
import type { ConstraintsBuilder } from "@tinsep19/kiwumil/layout/layout_constraints"
import { DefaultTheme } from "@tinsep19/kiwumil/theme"
import type { Theme } from "@tinsep19/kiwumil/theme"
import {
  toSymbolId,
  type SymbolOrId,
} from "@tinsep19/kiwumil/dsl/symbol_helpers"
import { CircleSymbol, TextSymbol } from "@tinsep19/kiwumil/plugin/core"
import { ActorSymbol, SystemBoundarySymbol } from "@tinsep19/kiwumil/plugin/uml"

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

  ensureLayoutBounds(_builder: ConstraintsBuilder): void {
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
  createSymbolFactory(symbols, layout, _theme: Theme) {
    const plugin = this.name

    return {
      node(label: string): TestSymbol {
        const symbol = symbols.register(plugin, "node", (symbolId) => {
          const bound = layout.variables.createBound(symbolId)
          return new TestSymbol(symbolId, label, bound)
        }) as TestSymbol
        return symbol
      },
    }
  },
  createRelationshipFactory(relationships, layout, _theme: Theme) {
    void layout
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

TypeDiagram("Default Core").build((el, rel) => {
  const _core = el.core
  expectAssignable<object>(_core)
  expectType<CircleSymbol>(el.core.circle("Circle"))
  expectType<TextSymbol>(el.core.text("Multi\nLine"))
  expectType<TextSymbol>(el.core.text({ label: "Info object", textAnchor: "start" }))

  // @ts-expect-error - UMLPlugin not registered yet
  const _uml = el.uml

  // @ts-expect-error - Core plugin does not expose relationships
  const _relCore = rel.core

  void _uml
  void _relCore
})

TypeDiagram("UML Plugin")
  .use(UMLPlugin)
  .build((el, rel) => {
    const _uml = el.uml
    expectAssignable<object>(_uml)

    const user = el.uml.actor("User")
    expectType<ActorSymbol>(user)
    const boundary = el.uml.systemBoundary("System")
    expectType<SystemBoundarySymbol>(boundary)

    const _relUml = rel.uml
    expectAssignable<object>(_relUml)

    void _relUml
  })

TypeDiagram("Multiple Plugins")
  .use(UMLPlugin)
  .use(CustomPlugin)
  .build((el, rel) => {
    const _uml = el.uml
    expectAssignable<object>(_uml)

    const _custom = el.custom
    expectAssignable<object>(_custom)

    const user = el.uml.actor("User")
    const node = el.custom.node("Node")
    expectType<ActorSymbol>(user)
    expectType<TestSymbol>(node)

    const link = rel.custom.link(user, node)
    expectType<RelationshipId>(link)

    void rel
  })
