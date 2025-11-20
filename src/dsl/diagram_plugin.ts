// src/dsl/diagram_plugin.ts
import type { RelationshipBase } from "../model/relationship_base"
import type { SymbolId, RelationshipId } from "../model/types"
import type { LayoutContext } from "../layout/layout_context"
import type { SymbolsRegistry } from "../symbols/registry"

/* eslint-disable @typescript-eslint/no-explicit-any */
type SymbolFactoryMap = Record<string, (...args: any[]) => SymbolId>
type RelationshipFactoryMap = Record<string, (...args: any[]) => RelationshipId>
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Diagram Plugin Interface
 * 
 * プラグインは名前空間を持ち、Symbol と Relationship の DSL ファクトリを提供する
 */
export interface DiagramPlugin {
  /**
   * プラグインの名前空間名（例: "uml", "sequence", "erd"）
   */
  readonly name: string

  /**
   * Symbol 用の DSL ファクトリを生成
   * 
   * @param registry - シンボルを登録する SymbolsRegistry
   * @param layout - レイアウトコンテキスト
   * @returns Symbol 作成関数のオブジェクト（各関数は SymbolId を返す）
   */
  createSymbolFactory?(
    registry: SymbolsRegistry,
    layout: LayoutContext
  ): SymbolFactoryMap

  /**
   * Relationship 用の DSL ファクトリを生成
   * 
   * @param relationships - 生成した Relationship を登録する配列
   * @returns Relationship 作成関数のオブジェクト（各関数は RelationshipId を返す）
   */
  createRelationshipFactory?(
    relationships: RelationshipBase[],
    layout: LayoutContext
  ): RelationshipFactoryMap
}
