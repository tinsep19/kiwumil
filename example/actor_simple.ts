// example/actor_simple.ts
import { TypedDiagram, UMLPlugin } from "../src/index"

TypedDiagram("Simple Actor")
  .use(UMLPlugin)
  .build((element, relation, hint) => {
    element.uml.actor("User")
  })
  .render("example/actor_simple.svg")

