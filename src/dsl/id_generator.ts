// src/dsl/id_generator.ts
import type { SymbolId, RelationshipId } from "../model/types"

/**
 * ID 生成ヘルパー
 * 
 * プラグインごとに独立した ID カウンターを管理し、
 * 名前空間付き ID を生成する
 */
export interface IdGenerator {
  /**
   * Symbol ID を生成
   * @param symbolName - Symbol の種類名（例: "actor", "usecase"）
   * @returns 生成された SymbolId（例: "uml:actor-0"）
   */
  generateSymbolId(symbolName: string): SymbolId

  /**
   * Relationship ID を生成
   * @param relationshipName - Relationship の種類名（例: "association", "include"）
   * @returns 生成された RelationshipId（例: "uml:association-0"）
   */
  generateRelationshipId(relationshipName: string): RelationshipId
}

/**
 * ID 生成ヘルパーを作成
 * 
 * @param namespace - プラグインの名前空間（例: "uml", "sequence"）
 * @returns IdGenerator インスタンス
 * 
 * @example
 * ```typescript
 * const idGen = createIdGenerator('uml')
 * const id1 = idGen.generateSymbolId('actor')     // "uml:actor-0"
 * const id2 = idGen.generateSymbolId('usecase')   // "uml:usecase-0"
 * const id3 = idGen.generateRelationshipId('association') // "uml:association-0"
 * ```
 */
export function createIdGenerator(namespace: string): IdGenerator {
  let symbolCounter = 0
  let relationshipCounter = 0

  return {
    generateSymbolId(symbolName: string): SymbolId {
      return `${namespace}:${symbolName}-${symbolCounter++}` as SymbolId
    },

    generateRelationshipId(relationshipName: string): RelationshipId {
      return `${namespace}:${relationshipName}-${relationshipCounter++}` as RelationshipId
    }
  }
}
