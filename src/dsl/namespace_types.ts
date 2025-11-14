// src/dsl/namespace_types.ts
import type { DiagramPlugin } from "./diagram_plugin"

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
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createSymbolFactory']
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
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createRelationshipFactory']
  >
}
