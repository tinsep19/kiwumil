import type { RelationshipBase } from "./relationship_base"
import type { RelationshipId } from "./types"

/**
 * Relationship 管理クラス
 *
 * Relationship の収集と ID 生成を一元化する。
 */
export class Relationships {
  private readonly relationships: RelationshipBase[] = []

  /**
   * 指定したプラグインによる Relationship を登録し、RelationshipBase を返す。
   */
  register(
    plugin: string,
    relationshipName: string,
    factory: (relationshipId: RelationshipId) => RelationshipBase
  ): RelationshipBase {
    const relationshipId = this.createRelationshipId(plugin, relationshipName)
    const relationship = factory(relationshipId)
    this.relationships.push(relationship)
    return relationship
  }

  /**
   * 登録済み Relationship を列挙する読み取り専用配列
   */
  getAll(): readonly RelationshipBase[] {
    return this.relationships
  }

  /**
   * 登録済み Relationship の数
   */
  get size(): number {
    return this.relationships.length
  }

  private createRelationshipId(plugin: string, relationshipName: string): RelationshipId {
    const idIndex = this.relationships.length
    return `${plugin}:${relationshipName}/${idIndex}` as RelationshipId
  }
}
