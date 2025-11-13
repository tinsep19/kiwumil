import { Diagram, UMLPlugin } from "../src/index"

Diagram("Nested System Boundaries")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // Create boundaries and use cases
    const outerSystem = el.systemBoundary("Outer System")
    const innerSystem = el.systemBoundary("Inner System")
    
    const outerUsecase = el.usecase("Outer Task")
    const innerUsecase = el.usecase("Inner Task")
    
    const user = el.actor("User")
    
    // Pack: Inner system contains innerUsecase
    hint.enclose(innerSystem, [innerUsecase])
    
    // Pack: Outer system contains outerUsecase and innerSystem
    hint.enclose(outerSystem, [outerUsecase, innerSystem])
    
    // Relationships
    rel.associate(user, outerUsecase)
    rel.associate(user, innerUsecase)
  })
  .render("example/system_boundary_nested.svg")
