[日本語](user-hint-registration.ja.md) | English

# UserHintRegistration System

## Overview

The UserHintRegistration system provides a structured way to register and manage user-created layout hints, similar to how SymbolRegistration manages user-created symbols. This system enables users to create custom layout constraints and variables through a factory pattern.

## Design Philosophy

### Separation of Concerns

- **Hints class**: Manages state (variables, constraints, registrations) and provides low-level APIs
- **UserHintRegistrationBuilder**: Provides factory methods for creating hint-specific variables and constraints
- **Hint Builder Helpers**: Provide high-level factory functions for common layout patterns

### Consistency with SymbolRegistration

The UserHintRegistration pattern mirrors the SymbolRegistration pattern:

| SymbolRegistration | UserHintRegistration |
|-------------------|---------------------|
| `Symbols.register()` | `Hints.register()` |
| `SymbolRegistrationBuilder` | `UserHintRegistrationBuilder` |
| `SymbolRegistration` type | `UserHintRegistration` type |

## Core Types

### UserHintRegistration

```typescript
export interface UserHintRegistration {
  /** Unique identifier for this hint */
  id: string
  /** Variables created for this hint */
  variables: HintVariable[]
  /** Constraints created for this hint */
  constraints: LayoutConstraint[]
}
```

### UserHintRegistrationBuilder

```typescript
export class UserHintRegistrationBuilder {
  /**
   * Create a hint variable for this user hint.
   * The variable name will be prefixed with "hint:" automatically.
   */
  createHintVariable(options?: HintVariableOptions): HintVariable

  /**
   * Create a constraint for this user hint.
   */
  createConstraint(constraintId: string, spec: ConstraintSpec): LayoutConstraint

  /**
   * Build and return the final UserHintRegistration.
   */
  build(): UserHintRegistration
}
```

## Basic Usage

### Registering a Custom Hint

```typescript
const registration = context.hints.register("custom-guide", (builder) => {
  // Create a guide variable
  const guideX = builder.createHintVariable({ 
    baseName: "guide_x", 
    name: "custom" 
  })
  
  // Set the guide to x=150
  builder.createConstraint("custom-guide/init", (cb) => {
    cb.ct([1, guideX.variable]).eq([150, 1]).strong()
  })
  
  return builder.build()
})

// Access registration information
console.log(registration.id) // "hint:custom-guide/0"
console.log(registration.variables.length) // 1
console.log(registration.constraints.length) // 1
```

### Using Hint Builder Helpers

The `hint_builder_helpers` module provides factory functions for common layout patterns:

```typescript
import {
  createArrangeHorizontalConstraint,
  createAlignLeftConstraint,
  createGuideValueConstraint,
} from "kiwumil/dsl"

context.hints.register("layout-pattern", (builder) => {
  const targets = [
    { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
    { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
    { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
  ]
  
  // Arrange horizontally with 20px gap
  createArrangeHorizontalConstraint(builder, targets, 20, "arrange/h")
  
  // Align to left edge
  createAlignLeftConstraint(builder, targets, "align/left")
  
  return builder.build()
})
```

## Available Helper Functions

### Arrangement Helpers

- `createArrangeHorizontalConstraint(builder, targets, gap, constraintId)`
- `createArrangeVerticalConstraint(builder, targets, gap, constraintId)`

### Alignment Helpers

- `createAlignLeftConstraint(builder, targets, constraintId)`
- `createAlignRightConstraint(builder, targets, constraintId)`
- `createAlignTopConstraint(builder, targets, constraintId)`
- `createAlignBottomConstraint(builder, targets, constraintId)`
- `createAlignCenterXConstraint(builder, targets, constraintId)`
- `createAlignCenterYConstraint(builder, targets, constraintId)`
- `createAlignWidthConstraint(builder, targets, constraintId)`
- `createAlignHeightConstraint(builder, targets, constraintId)`

### Container Helpers

- `createEncloseConstraint(builder, container, children, constraintId)`

### Guide Helpers

- `createGuideValueConstraint(builder, variable, value, constraintId)`

## Advanced Usage

### Combining Multiple Constraints

```typescript
context.hints.register("complex-layout", (builder) => {
  const targets = [rect1, rect2, rect3].map(r => ({
    boundId: r.bounds.boundId,
    bounds: r.bounds,
  }))
  
  // Arrange vertically
  createArrangeVerticalConstraint(builder, targets, 10, "arrange/v")
  
  // And align centers horizontally
  createAlignCenterXConstraint(builder, targets, "align/centerX")
  
  return builder.build()
})
```

### Creating Custom Guide Systems

```typescript
context.hints.register("guide-system", (builder) => {
  // Create guide variables
  const leftGuide = builder.createHintVariable({ 
    baseName: "guide_x", 
    name: "left" 
  })
  const rightGuide = builder.createHintVariable({ 
    baseName: "guide_x", 
    name: "right" 
  })
  
  // Set guide positions
  createGuideValueConstraint(builder, leftGuide.variable, 100, "guide/left")
  createGuideValueConstraint(builder, rightGuide.variable, 400, "guide/right")
  
  // Align symbols to guides
  builder.createConstraint("guide/align-to-left", (cb) => {
    cb.ct([1, rect1.bounds.x]).eq([1, leftGuide.variable]).strong()
  })
  
  builder.createConstraint("guide/align-to-right", (cb) => {
    cb.ct([1, rect2.bounds.right]).eq([1, rightGuide.variable]).strong()
  })
  
  return builder.build()
})
```

## Query and Inspection

### Get All Registrations

```typescript
const allRegistrations = context.hints.getAllRegistrations()
console.log(`Total hints registered: ${allRegistrations.length}`)
```

### Find Registration by ID

```typescript
const registration = context.hints.findRegistrationById("hint:custom-guide/0")
if (registration) {
  console.log(`Found: ${registration.id}`)
  console.log(`Variables: ${registration.variables.length}`)
  console.log(`Constraints: ${registration.constraints.length}`)
}
```

## Backward Compatibility

The existing Hints API remains fully functional:

```typescript
// Old API still works
const hintVar = context.hints.createHintVariable({ 
  baseName: "legacy", 
  name: "var" 
})

context.hints.arrangeHorizontal(targets)
context.hints.alignLeft(targets)
```

## Benefits

1. **Modularity**: User hints are self-contained registrations
2. **Reusability**: Helper functions can be composed and reused
3. **Type Safety**: Full TypeScript support with type inference
4. **Inspectability**: All registrations can be queried and inspected
5. **Consistency**: Follows the same pattern as SymbolRegistration
6. **Flexibility**: Mix old and new APIs as needed

## See Also

- [Layout System](./layout-system.md) - Core layout constraint system
- [Layout Hints API](./layout-hints.md) - High-level hint API documentation
