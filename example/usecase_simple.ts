import { Diagram, UMLPlugin } from "../src/index"

Diagram("TODO")
  .use(UMLPlugin)
  .build("Simple Usecase", (element, relation, hint) => {
    element.usecase("Login")
  })
  .render("example/usecase_simple.svg")
