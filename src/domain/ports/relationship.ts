// src/domain/ports/relationship.ts
// 関連のインターフェース定義

import type { RelationshipId } from "../../model/types"
import type { RenderModel } from "./symbol"

/**
 * IRelationship: 要素間の関係性が実装すべきインターフェース
 * プラグインから提供される実体
 */
export interface IRelationship {
  id: RelationshipId
  render(): RenderModel
}

/**
 * IRelationshipCharacs: 関連に付随するレイアウト情報
 * 拡張フィールドを型安全に追加可能
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type IRelationshipCharacs<T extends object = {}> = {
  id: RelationshipId
} & T
