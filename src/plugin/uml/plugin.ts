// src/plugin/uml/plugin.ts
import { ActorSymbol } from "./symbols/actor_symbol"
import { UsecaseSymbol } from "./symbols/usecase_symbol"
import { SystemBoundarySymbol } from "./symbols/system_boundary_symbol"
import { Association } from "./relationships/association"
import { Include } from "./relationships/include"
import { Extend } from "./relationships/extend"
import { Generalize } from "./relationships/generalize"
import type { DiagramPlugin } from "../../dsl/diagram_plugin"
import type { SymbolId, RelationshipId, ContainerSymbolId } from "../../model/types"
import { toContainerSymbolId } from "../../model/container_symbol_base"
import type { LayoutContext } from "../../layout/layout_context"
import type { Symbols } from "../../dsl/symbols"
import type { Relationships } from "../../dsl/relationships"

/**
 * UML Plugin (Namespace-based)
 * 
 * UML 図のための Symbol と Relationship を提供する
 */
export const UMLPlugin = {
  name: 'uml',
  
  createSymbolFactory(symbols: Symbols, layout: LayoutContext) {
    const plugin = this.name
    
    return {
      /**
       * Actor Symbol を作成
       * @param label - Actor のラベル
       * @returns 生成された SymbolId
       */
      actor(label: string): SymbolId {
        const symbol = symbols.register(plugin, 'actor', (symbolId) => {
          const actor = new ActorSymbol(symbolId, label, layout.vars)
          layout.applyFixedSize(actor)
          return actor
        })
        return symbol.id
      },
      
      /**
       * Usecase Symbol を作成
       * @param label - Usecase のラベル
       * @returns 生成された SymbolId
       */
      usecase(label: string): SymbolId {
        const symbol = symbols.register(plugin, 'usecase', (symbolId) => {
          const usecase = new UsecaseSymbol(symbolId, label, layout.vars)
          layout.applyFixedSize(usecase)
          return usecase
        })
        return symbol.id
      },
      
      /**
       * System Boundary Symbol を作成
       * @param label - System Boundary のラベル
       * @returns 生成された SymbolId
       */
      systemBoundary(label: string): ContainerSymbolId {
        const symbol = symbols.register(plugin, 'systemBoundary', (symbolId) => {
          const id = toContainerSymbolId(symbolId)
          return new SystemBoundarySymbol(id, label, layout)
        })
        return symbol.id as ContainerSymbolId
      }
    }
  },
  
  createRelationshipFactory(relationships: Relationships, _layout: LayoutContext) {
    const plugin = this.name
    
    return {
      /**
       * Association Relationship を作成
       * @param from - 開始 Symbol の ID
       * @param to - 終了 Symbol の ID
       * @returns 生成された RelationshipId
       */
      associate(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, 'association', (id) => new Association(id, from, to))
        return relationship.id
      },
      
      /**
       * Include Relationship を作成
       * @param from - 開始 Symbol の ID
       * @param to - 終了 Symbol の ID
       * @returns 生成された RelationshipId
       */
      include(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, 'include', (id) => new Include(id, from, to))
        return relationship.id
      },
      
      /**
       * Extend Relationship を作成
       * @param from - 開始 Symbol の ID
       * @param to - 終了 Symbol の ID
       * @returns 生成された RelationshipId
       */
      extend(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, 'extend', (id) => new Extend(id, from, to))
        return relationship.id
      },
      
      /**
       * Generalize Relationship を作成
       * @param from - 開始 Symbol の ID (子)
       * @param to - 終了 Symbol の ID (親)
       * @returns 生成された RelationshipId
       */
      generalize(from: SymbolId, to: SymbolId): RelationshipId {
        const relationship = relationships.register(plugin, 'generalize', (id) => new Generalize(id, from, to))
        return relationship.id
      }
    }
  }
} as const satisfies DiagramPlugin
