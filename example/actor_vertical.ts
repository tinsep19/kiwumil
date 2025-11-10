// example/actor_vertical.ts
import { Diagram, UMLPlugin } from "../src/index"

Diagram
  .use(UMLPlugin)
  .build("Vertical Actors", (element, relation, hint) => {
    const user1 = element.actor("User")
    const user2 = element.actor("Admin")
    const user3 = element.actor("Guest")

    hint.vertical(user1, user2, user3)
  })
  .render("example/actor_vertical.svg")
