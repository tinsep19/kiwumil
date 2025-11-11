// src/dsl/relationship_factory.ts
import { Association } from "../plugin/uml/relationships/association"
import type { SymbolId } from "../model/types"

export class RelationshipFactory {
  constructor(private relationships: Association[]) {}

  associate(from: SymbolId, to: SymbolId): void {
    this.relationships.push(new Association(from, to))
  }
}
