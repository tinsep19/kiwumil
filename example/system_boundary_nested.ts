import { Diagram, CorePlugin } from "../src/index"

Diagram
  .use(CorePlugin)
  .build("Nested System Boundaries", (el, rel, hint) => {
    // Create boundaries and use cases
    const outerSystem = el.systemBoundary("Outer System")
    const innerSystem = el.systemBoundary("Inner System")
    
    const outerUsecase = el.usecase("Outer Task")
    const innerUsecase = el.usecase("Inner Task")
    
    const user = el.actor("User")
    
    // Pack: Inner system contains innerUsecase
    hint.pack(innerSystem, [innerUsecase])
    
    // Pack: Outer system contains outerUsecase and innerSystem
    hint.pack(outerSystem, [outerUsecase, innerSystem])
    
    // Relationships
    rel.associate(user, outerUsecase)
    rel.associate(user, innerUsecase)
  })
  .render("example/system_boundary_nested.svg")
