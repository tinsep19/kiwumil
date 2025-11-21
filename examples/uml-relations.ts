import { TypeDiagram, UMLPlugin } from "../src/index"

TypeDiagram("UML Relations Example")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // Create three use cases
    const usecaseA = el.uml.usecase("UseCase A")
    const usecaseB = el.uml.usecase("UseCase B")
    const usecaseC = el.uml.usecase("UseCase C")
    
    // Create relationships
    // A include B
    rel.uml.include(usecaseA, usecaseB)
    // B extend C
    rel.uml.extend(usecaseB, usecaseC)
    // C generalize A
    rel.uml.generalize(usecaseC, usecaseA)
    
    // Layout: A and B on the left side, vertically arranged
    // C on the right side, at the same Y coordinate as B
    hint.arrangeVertical(usecaseA, usecaseB)
    hint.arrangeHorizontal(usecaseB, usecaseC)
  })
  .render("example/uml-relations.svg")
