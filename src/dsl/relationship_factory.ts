// src/dsl/relationship_factory.ts
import { Association } from "../plugin/uml/relationships/association"
import { Include } from "../plugin/uml/relationships/include"
import { Extend } from "../plugin/uml/relationships/extend"
import { Generalize } from "../plugin/uml/relationships/generalize"
import type { SymbolId } from "../model/types"

type Relationship = Association | Include | Extend | Generalize

export class RelationshipFactory {
  constructor(private relationships: Relationship[]) {}

  associate(from: SymbolId, to: SymbolId): void {
    this.relationships.push(new Association(from, to))
  }

  include(from: SymbolId, to: SymbolId): void {
    this.relationships.push(new Include(from, to))
  }

  extend(from: SymbolId, to: SymbolId): void {
    this.relationships.push(new Extend(from, to))
  }

  generalize(from: SymbolId, to: SymbolId): void {
    this.relationships.push(new Generalize(from, to))
  }
}
