// src/dsl/diagram_plugin.ts
import type { RelationshipId, SymbolRegistry, RelationshipRegistry } from "../model"
import type { Theme } from "../theme"
import type { PluginIcons } from "./namespace_types"
import type { ISymbolCharacs } from "../core"
import type { IconRegistry } from "../icon"

/* eslint-disable @typescript-eslint/no-explicit-any */
type SymbolFactoryMap = Record<string, (...args: any[]) => ISymbolCharacs<any>>
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
   * @param symbols - 生成した Symbol を登録するインスタンス
   * @returns Symbol 作成関数のオブジェクト（各関数は `SymbolBase` を返す）
   */
  createSymbolFactory?(symbols: SymbolRegistry, theme: Theme, icons: PluginIcons): SymbolFactoryMap

  /**
   * Relationship 用の DSL ファクトリを生成
   *
   * @param relationships - 生成した Relationship を登録するインスタンス
   * @returns Relationship 作成関数のオブジェクト（各関数は RelationshipId を返す）
   */
  createRelationshipFactory?(
    relationships: RelationshipRegistry,
    theme: Theme,
    icons: PluginIcons
  ): RelationshipFactoryMap

  /**
   * Optional: plugin can create icon factory. Returns a map of icon names to loader functions.
   */
  createIconFactory?(registry: IconRegistry): PluginIcons
}
