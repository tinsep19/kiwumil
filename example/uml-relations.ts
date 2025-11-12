import { Diagram, UMLPlugin } from "../src/index"

Diagram
  .use(UMLPlugin)
  .build("UML Relations Example", (element, relation, hint) => {
    // Create three use cases
    const usecaseA = element.usecase("UseCase A")
    const usecaseB = element.usecase("UseCase B")
    const usecaseC = element.usecase("UseCase C")
    
    // Create relationships
    // A include B
    relation.include(usecaseA, usecaseB)
    // B extend C
    relation.extend(usecaseB, usecaseC)
    // C generalize A
    relation.generalize(usecaseC, usecaseA)
    
    // Layout: A and B on the left side, vertically arranged
    // C on the right side, at the same Y coordinate as B
    hint.vertical(usecaseA, usecaseB)
    hint.horizontal(usecaseB, usecaseC)
  })
  .render("example/uml-relations.svg")
