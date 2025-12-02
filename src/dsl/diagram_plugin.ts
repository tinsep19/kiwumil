// src/dsl/diagram_plugin.ts
import type { RelationshipId, SymbolBase, Symbols } from "../model"
import type { LayoutContext } from "../layout"
import type { Relationships } from "./relationships"
import type { Theme } from "../theme"
import type { PluginIcons } from "./namespace_types"

/* eslint-disable @typescript-eslint/no-explicit-any */
type SymbolFactoryMap = Record<string, (...args: any[]) => SymbolBase>
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
  createSymbolFactory?(symbols: Symbols, context: LayoutContext, theme: Theme, icons: PluginIcons): SymbolFactoryMap

  /**
   * Relationship 用の DSL ファクトリを生成
   *
   * @param relationships - 生成した Relationship を登録するインスタンス
   * @returns Relationship 作成関数のオブジェクト（各関数は RelationshipId を返す）
   */
  createRelationshipFactory?(
    relationships: Relationships,
    context: LayoutContext,
    theme: Theme,
    icons: PluginIcons
  ): RelationshipFactoryMap

  /**
   * Optional: plugin can register icons. The icons API provides createLoader(plugin, importMeta, cb)
   */
  registerIcons?(icons: {
    createLoader: (
      plugin: string,
      importMeta: ImportMeta,
      cb: (loader: { register: (name: string, relPath: string) => void }) => void
    ) => void
  }): void
}
