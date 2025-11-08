// example/actor_simple.ts
import { Diagram, CorePlugin } from "../src/index"

const diagram = Diagram.use(CorePlugin).build("Simple Actor", (element, relation, hint) => {
  const user = element.actor("User")
})

diagram.render("output/actor_simple.svg")
