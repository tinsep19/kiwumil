import { TypeDiagram, UMLPlugin } from "../src/index"

TypeDiagram("Nested System Boundaries")
  .use(UMLPlugin)
  .layout(({ el, rel, hint }) => {
    // Create boundaries and use cases
    const outerSystem = el.uml.systemBoundary("Outer System")
    const innerSystem = el.uml.systemBoundary("Inner System")
    
    const outerUsecase = el.uml.usecase("Outer Task")
    const innerUsecase = el.uml.usecase("Inner Task")
    
    const user = el.uml.actor("User")

    // Relationships
    rel.uml.associate(user, outerUsecase)
    rel.uml.associate(user, innerUsecase)
    
    // Pack: Inner system contains innerUsecase
    hint.enclose(innerSystem, [innerUsecase])
    
    // Pack: Outer system contains outerUsecase and innerSystem
    hint.enclose(outerSystem, [outerUsecase, innerSystem])

    hint.arrangeVertical(innerSystem, outerUsecase)
    hint.arrangeHorizontal(outerSystem, user)
    
  })
  .render(import.meta)
