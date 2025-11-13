import { Diagram, UMLPlugin } from "../src/index"

Diagram("Simple Usecase")
  .use(UMLPlugin)
  .build((element, relation, hint) => {
    element.usecase("Login")
  })
  .render("example/usecase_simple.svg")
