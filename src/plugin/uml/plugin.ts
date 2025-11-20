// src/plugin/uml/plugin.ts
import { ActorSymbol } from "./symbols/actor_symbol"
import { UsecaseSymbol } from "./symbols/usecase_symbol"
import { SystemBoundarySymbol } from "./symbols/system_boundary_symbol"
import { Association } from "./relationships/association"
import { Include } from "./relationships/include"
import { Extend } from "./relationships/extend"
import { Generalize } from "./relationships/generalize"
import { createIdGenerator } from "../../dsl/id_generator"
import type { DiagramPlugin } from "../../dsl/diagram_plugin"
import type { SymbolsRegistry } from "../../symbols/registry"
import type { RelationshipBase } from "../../model/relationship_base"
import type { SymbolId, RelationshipId, ContainerSymbolId } from "../../model/types"
import { toContainerSymbolId } from "../../model/container_symbol_base"
import type { LayoutContext } from "../../layout/layout_context"

/**
 * UML Plugin (Namespace-based)
 * 
 * UML 図のための Symbol と Relationship を提供する
 */
export const UMLPlugin = {
  name: 'uml',
  
  createSymbolFactory(registry: SymbolsRegistry, layout: LayoutContext) {
    return {
      /**
       * Actor Symbol を作成
       * @param label - Actor のラベル
       * @returns 生成された SymbolId
       */
      actor(label: string): SymbolId {
        const symbol = registry.register('uml', 'actor', (id, _boundsBuilder) => {
          const symbol = new ActorSymbol(id, label, layout.vars)
          layout.applyFixedSize(symbol)
          return symbol
        })
        return symbol.id
      },
      
      /**
       * Usecase Symbol を作成
       * @param label - Usecase のラベル
       * @returns 生成された SymbolId
       */
      usecase(label: string): SymbolId {
        const symbol = registry.register('uml', 'usecase', (id, _boundsBuilder) => {
          const symbol = new UsecaseSymbol(id, label, layout.vars)
          layout.applyFixedSize(symbol)
          return symbol
        })
        return symbol.id
      },
      
      /**
       * System Boundary Symbol を作成
       * @param label - System Boundary のラベル
       * @returns 生成された SymbolId
       */
      systemBoundary(label: string): ContainerSymbolId {
        const symbol = registry.register('uml', 'systemBoundary', (id, _boundsBuilder) => {
          const containerId = toContainerSymbolId(id)
          const symbol = new SystemBoundarySymbol(containerId, label, layout)
          return symbol
        })
        return symbol.id as ContainerSymbolId
      }
    }
  },
  
  createRelationshipFactory(relationships: RelationshipBase[], _layout: LayoutContext) {
    const idGen = createIdGenerator(this.name)
    
    return {
      /**
       * Association Relationship を作成
       * @param from - 開始 Symbol の ID
       * @param to - 終了 Symbol の ID
       * @returns 生成された RelationshipId
       */
      associate(from: SymbolId, to: SymbolId): RelationshipId {
        const id = idGen.generateRelationshipId('association')
        relationships.push(new Association(id, from, to))
        return id
      },
      
      /**
       * Include Relationship を作成
       * @param from - 開始 Symbol の ID
       * @param to - 終了 Symbol の ID
       * @returns 生成された RelationshipId
       */
      include(from: SymbolId, to: SymbolId): RelationshipId {
        const id = idGen.generateRelationshipId('include')
        relationships.push(new Include(id, from, to))
        return id
      },
      
      /**
       * Extend Relationship を作成
       * @param from - 開始 Symbol の ID
       * @param to - 終了 Symbol の ID
       * @returns 生成された RelationshipId
       */
      extend(from: SymbolId, to: SymbolId): RelationshipId {
        const id = idGen.generateRelationshipId('extend')
        relationships.push(new Extend(id, from, to))
        return id
      },
      
      /**
       * Generalize Relationship を作成
       * @param from - 開始 Symbol の ID (子)
       * @param to - 終了 Symbol の ID (親)
       * @returns 生成された RelationshipId
       */
      generalize(from: SymbolId, to: SymbolId): RelationshipId {
        const id = idGen.generateRelationshipId('generalize')
        relationships.push(new Generalize(id, from, to))
        return id
      }
    }
  }
} as const satisfies DiagramPlugin
