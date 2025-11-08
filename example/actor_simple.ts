// example/actor_simple.ts
import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Simple Actor", (element, relation, hint) => {
    element.actor("User")
  })
  .render("example/actor_simple.svg")
