// example/actor_horizontal.ts
import { Diagram, CorePlugin } from "../src/index"

const diagram = Diagram.use(CorePlugin).build("Horizontal Actors", (element, relation, hint) => {
  const user1 = element.actor("User")
  const user2 = element.actor("Admin")
  const user3 = element.actor("Guest")

  hint.horizontal(user1, user2, user3)
})

diagram.render("output/actor_horizontal.svg")
