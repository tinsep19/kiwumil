// example/actor_simple.ts
import { Diagram, UMLPlugin } from "../src/index"

Diagram("Simple Actor")
  .use(UMLPlugin)
  .build((element, relation, hint) => {
    element.actor("User")
  })
  .render("example/actor_simple.svg")
