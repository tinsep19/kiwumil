import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Simple Usecase", (element, relation, hint) => {
    element.usecase("Login")
  })
  .render("example/usecase_simple.svg")
