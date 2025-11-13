// example/actor_horizontal.ts
import { Diagram, UMLPlugin } from "../src/index"

Diagram("TODO")
  .use(UMLPlugin)
  .build("Horizontal Actors", (element, relation, hint) => {
    const user1 = element.actor("User")
    const user2 = element.actor("Admin")
    const user3 = element.actor("Guest")

    hint.horizontal(user1, user2, user3)
  })
  .render("example/actor_horizontal.svg")
