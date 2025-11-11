// src/plugin/uml/index.ts
import { ActorSymbol } from "./symbols/actor_symbol"
import { UsecaseSymbol } from "./symbols/usecase_symbol"
import { SystemBoundarySymbol } from "./symbols/system_boundary_symbol"
import { KiwumilPlugin } from "../../dsl/plugin_manager"
import { SymbolRegistry } from "../../model/symbol_registry"
import { RelationshipRegistry } from "../../model/relationship_registry"

export const UMLPlugin: KiwumilPlugin = {
  name: "UMLPlugin",
  registerSymbols(symbols: SymbolRegistry) {
    symbols.register("actor", ActorSymbol)
    symbols.register("usecase", UsecaseSymbol)
    symbols.register("systemBoundary", SystemBoundarySymbol)
  },
  registerRelationships(relationships: RelationshipRegistry) {
    // UMLPluginではまだ関係を登録しない
  }
}
