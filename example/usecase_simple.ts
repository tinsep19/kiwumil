import { Diagram, CorePlugin } from "../src/index"

const diagram = Diagram.use(CorePlugin).build("Simple Usecase", (element) => {
  element.usecase("Login")
})

diagram.render("example/usecase_simple.svg")
