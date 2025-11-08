// src/model/relationship_registry.ts

export class RelationshipRegistry {
  private types = new Map<string, any>()

  register(typeName: string, constructor: any) {
    this.types.set(typeName, constructor)
  }

  has(typeName: string): boolean {
    return this.types.has(typeName)
  }
}
