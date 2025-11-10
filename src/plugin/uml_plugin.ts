// src/plugin/uml_plugin.ts
import { ActorSymbol } from "../model/symbols/actor_symbol"
import { UsecaseSymbol } from "../model/symbols/usecase_symbol"
import { SystemBoundarySymbol } from "../model/symbols/system_boundary_symbol"
import { KiwumilPlugin } from "../dsl/plugin_manager"
import { SymbolRegistry } from "../model/symbol_registry"
import { RelationshipRegistry } from "../model/relationship_registry"

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
