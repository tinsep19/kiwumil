// src/dsl/diagram_plugin.ts
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { SymbolId, RelationshipId } from "../model/types"

/**
 * Diagram Plugin Interface
 * 
 * プラグインは名前空間を持ち、Symbol と Relationship の DSL ファクトリを提供する
 */
type SymbolFactoryMap = Record<string, (...args: unknown[]) => SymbolId>
type RelationshipFactoryMap = Record<string, (...args: unknown[]) => RelationshipId>

export interface DiagramPlugin {
  /**
   * プラグインの名前空間名（例: "uml", "sequence", "erd"）
   */
  readonly name: string

  /**
   * Symbol 用の DSL ファクトリを生成
   * 
   * @param userSymbols - 生成した Symbol を登録する配列
   * @returns Symbol 作成関数のオブジェクト（各関数は SymbolId を返す）
   */
  createSymbolFactory?(
    userSymbols: SymbolBase[]
  ): SymbolFactoryMap

  /**
   * Relationship 用の DSL ファクトリを生成
   * 
   * @param relationships - 生成した Relationship を登録する配列
   * @returns Relationship 作成関数のオブジェクト（各関数は RelationshipId を返す）
   */
  createRelationshipFactory?(
    relationships: RelationshipBase[]
  ): RelationshipFactoryMap
}
