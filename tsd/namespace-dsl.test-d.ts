import { expectAssignable, expectType } from "tsd"
import {
  TypedDiagram,
  UMLPlugin,
  type DiagramPlugin,
  type SymbolId,
  type RelationshipId
} from "../dist"

const CustomPlugin = {
  name: "custom",
  createSymbolFactory(userSymbols) {
    void userSymbols
    return {
      node(label: string): SymbolId {
        void label
        return "custom:node-0" as SymbolId
      }
    }
  },
  createRelationshipFactory(relationships) {
    void relationships
    return {
      link(from: SymbolId, to: SymbolId): RelationshipId {
        void from
        void to
        return "custom:link-0" as RelationshipId
      }
    }
  }
} as const satisfies DiagramPlugin

TypedDiagram("Default Core").build((el, rel) => {
  const _core = el.core
  expectAssignable<object>(_core)
  expectType<SymbolId>(el.core.circle("Circle"))

  // @ts-expect-error - UMLPlugin not registered yet
  const _uml = el.uml

  // @ts-expect-error - Core plugin does not expose relationships
  const _relCore = rel.core

  void _uml
  void _relCore
})

TypedDiagram("UML Plugin")
  .use(UMLPlugin)
  .build((el, rel) => {
    const _uml = el.uml
    expectAssignable<object>(_uml)

    const user = el.uml.actor("User")
    expectType<SymbolId>(user)

    const _relUml = rel.uml
    expectAssignable<object>(_relUml)

    void _relUml
  })

TypedDiagram("Multiple Plugins")
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
