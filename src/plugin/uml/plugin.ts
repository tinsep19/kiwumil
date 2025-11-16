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
import type { SymbolBase } from "../../model/symbol_base"
import type { RelationshipBase } from "../../model/relationship_base"
import type { SymbolId, RelationshipId } from "../../model/types"

/**
 * UML Plugin (Namespace-based)
 * 
 * UML 図のための Symbol と Relationship を提供する
 */
export const UMLPlugin: DiagramPlugin = {
  name: 'uml',
  
  createSymbolFactory(userSymbols: SymbolBase[]) {
    const idGen = createIdGenerator(this.name)
    
    return {
      /**
       * Actor Symbol を作成
       * @param label - Actor のラベル
       * @returns 生成された SymbolId
       */
      actor(label: string): SymbolId {
        const id = idGen.generateSymbolId('actor')
        const symbol = new ActorSymbol(id, label)
        userSymbols.push(symbol)
        return id
      },
      
      /**
       * Usecase Symbol を作成
       * @param label - Usecase のラベル
       * @returns 生成された SymbolId
       */
      usecase(label: string): SymbolId {
        const id = idGen.generateSymbolId('usecase')
        const symbol = new UsecaseSymbol(id, label)
        userSymbols.push(symbol)
        return id
      },
      
      /**
       * System Boundary Symbol を作成
       * @param label - System Boundary のラベル
       * @returns 生成された SymbolId
       */
      systemBoundary(label: string): SymbolId {
        const id = idGen.generateSymbolId('systemBoundary')
        const symbol = new SystemBoundarySymbol(id, label)
        userSymbols.push(symbol)
        return id
      }
    }
  },
  
  createRelationshipFactory(relationships: RelationshipBase[]) {
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
}
