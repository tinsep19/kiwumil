import { expectAssignable, expectType } from "tsd"
import {
  TypeDiagram,
  UMLPlugin,
  type DiagramPlugin,
  type SymbolId,
  type RelationshipId,
  type ContainerSymbolId,
} from "../dist"
import { SymbolBase } from "../dist/model/symbol_base"
import {
  RelationshipBase,
  type RelationshipBaseOptions,
} from "../dist/model/relationship_base"
import type { Bounds } from "../dist/layout/bounds"
import { DefaultTheme } from "../dist/theme"
import type { Theme } from "../dist/theme"

class TestSymbol extends SymbolBase {
  readonly label: string

  constructor(id: SymbolId, label: string, layoutBounds: Bounds) {
    super({ id, layoutBounds, theme: DefaultTheme })
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
      node(label: string): SymbolId {
        const symbol = symbols.register(plugin, "node", (symbolId) => {
          const bound = layout.variables.createBound(symbolId)
          return new TestSymbol(symbolId, label, bound)
        })
        return symbol.id
      }
    }
  },
  createRelationshipFactory(relationships, layout, _theme: Theme) {
    void layout
    const plugin = this.name

    return {
      link(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(
          plugin,
          "link",
          (id) =>
            new TestRelationship({
              id,
              from,
              to,
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
  expectType<SymbolId>(el.core.circle("Circle"))
  expectType<SymbolId>(el.core.text("Multi\nLine"))
  expectType<SymbolId>(el.core.text({ label: "Info object", textAnchor: "start" }))

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
    expectType<SymbolId>(user)
    const boundary = el.uml.systemBoundary("System")
    expectType<ContainerSymbolId>(boundary)

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
    expectType<SymbolId>(user)
    expectType<SymbolId>(node)

    const link = rel.custom.link(user, node)
    expectType<RelationshipId>(link)

    void rel
  })
