// src/dsl/namespace_types.ts
import type { DiagramPlugin } from "./diagram_plugin"
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { SymbolId, RelationshipId } from "../model/types"

type SymbolEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  { createSymbolFactory: (userSymbols: SymbolBase[]) => Record<string, (...args: any[]) => SymbolId> }
>

type RelationshipEnabledPlugins<TPlugins extends readonly DiagramPlugin[]> = Extract<
  TPlugins[number],
  { createRelationshipFactory: (relationships: RelationshipBase[]) => Record<string, (...args: any[]) => RelationshipId> }
>

/**
 * プラグイン配列から ElementNamespace 型を生成
 * 
 * @example
 * ```typescript
 * type Plugins = [typeof UMLPlugin, typeof SequencePlugin]
 * type El = BuildElementNamespace<Plugins>
 * // => { uml: {...}, sequence: {...} }
 * ```
 */
export type BuildElementNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in SymbolEnabledPlugins<TPlugins>['name']]: ReturnType<
    Extract<SymbolEnabledPlugins<TPlugins>, { name: K }>['createSymbolFactory']
  >
}

/**
 * プラグイン配列から RelationshipNamespace 型を生成
 * 
 * @example
 * ```typescript
 * type Plugins = [typeof UMLPlugin, typeof SequencePlugin]
 * type Rel = BuildRelationshipNamespace<Plugins>
 * // => { uml: {...}, sequence: {...} }
 * ```
 */
export type BuildRelationshipNamespace<TPlugins extends readonly DiagramPlugin[]> = {
  [K in RelationshipEnabledPlugins<TPlugins>['name']]: ReturnType<
    Extract<RelationshipEnabledPlugins<TPlugins>, { name: K }>['createRelationshipFactory']
  >
}
