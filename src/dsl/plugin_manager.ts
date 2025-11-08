
import { SymbolRegistry } from "../model/symbol_registry"
import { RelationshipRegistry } from "../model/relationship_registry"

export interface KiwumilPlugin {
  name: string
  registerSymbols?: (registry: SymbolRegistry) => void
  registerRelationships?: (registry: RelationshipRegistry) => void
}

export class PluginManager {
  constructor(
    private symbols: SymbolRegistry,
    private relationships: RelationshipRegistry
  ) {}

  use(...plugins: KiwumilPlugin[]) {
    for (const plugin of plugins) {
      plugin.registerSymbols?.(this.symbols)
      plugin.registerRelationships?.(this.relationships)
      console.log(`[PluginManager] Loaded plugin: ${plugin.name}`)
    }
  }
}
