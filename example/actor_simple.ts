// example/actor_simple.ts
import { Diagram, UMLPlugin } from "../src/index"

Diagram("TODO")
  .use(UMLPlugin)
  .build("Simple Actor", (element, relation, hint) => {
    element.actor("User")
  })
  .render("example/actor_simple.svg")
