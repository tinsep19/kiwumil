// src/dsl/relationship_factory.ts
import { Association } from "../plugin/uml/relationships/association"
import { Include } from "../plugin/uml/relationships/include"
import { Extend } from "../plugin/uml/relationships/extend"
import { Generalize } from "../plugin/uml/relationships/generalize"
import type { SymbolId, RelationshipId } from "../model/types"

type Relationship = Association | Include | Extend | Generalize

export class RelationshipFactory {
  private counter = 0

  constructor(private relationships: Relationship[]) {}

  associate(from: SymbolId, to: SymbolId): RelationshipId {
    const id = `association_${this.counter++}` as RelationshipId
    this.relationships.push(new Association(id, from, to))
    return id
  }

  include(from: SymbolId, to: SymbolId): RelationshipId {
    const id = `include_${this.counter++}` as RelationshipId
    this.relationships.push(new Include(id, from, to))
    return id
  }

  extend(from: SymbolId, to: SymbolId): RelationshipId {
    const id = `extend_${this.counter++}` as RelationshipId
    this.relationships.push(new Extend(id, from, to))
    return id
  }

  generalize(from: SymbolId, to: SymbolId): RelationshipId {
    const id = `generalize_${this.counter++}` as RelationshipId
    this.relationships.push(new Generalize(id, from, to))
    return id
  }
}
