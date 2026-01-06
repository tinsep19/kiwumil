[日本語](user-hint-registration.ja.md) | English

# UserHintRegistration System

## Overview

The UserHintRegistration system provides a structured way to register and manage user-created layout hints, similar to how SymbolRegistration manages user-created symbols. This system enables users to create custom layout constraints and variables through a factory pattern.

## Design Philosophy

### Separation of Concerns

- **Hints class**: Manages state (registrations, constraints) and provides low-level APIs
- **UserHintRegistrationBuilder**: Provides factory methods for creating hint-specific variables and constraints
- **Hint Builder Helpers**: Provide ConstraintSpec generators for common layout patterns

### Consistency with SymbolRegistration

The UserHintRegistration pattern mirrors the SymbolRegistration pattern:

| SymbolRegistration | UserHintRegistration |
|-------------------|---------------------|
| `Symbols.register()` | `Hints.register()` |
| `SymbolRegistrationBuilder` | `UserHintRegistrationBuilder` |
| `SymbolRegistration` type | `UserHintRegistration` type |
| `createVariable(key)` | `createVariable(variableId)` |
| `setConstraint(spec)` | `setConstraint(spec)` |
| Single `constraint` | Single `constraint` |

## Core Types

### UserHintRegistration

```typescript
export interface UserHintRegistration {
  /** Unique identifier for this hint */
  id: string
  /** Constraint created for this hint */
  constraint: LayoutConstraint
}
```

### UserHintRegistrationBuilder

```typescript
export class UserHintRegistrationBuilder {
  /**
   * Create a variable for this user hint.
   * The variable name will be prefixed with the hint ID automatically.
   */
  createVariable(variableId: string): Variable

  /**
   * Set the constraint for this user hint.
   */
  setConstraint(spec: ConstraintSpec): LayoutConstraint

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
  const guideX = builder.createVariable("guide_x")
  
  // Set the constraint
  builder.setConstraint((cb) => {
    // Set the guide to x=150
    cb.ct([1, guideX]).eq([150, 1]).strong()
    // Align symbols to the guide
    cb.ct([1, rect1.bounds.x]).eq([1, guideX]).strong()
    cb.ct([1, rect2.bounds.x]).eq([1, guideX]).strong()
  })
  
  return builder.layout()
})

// Access registration information
console.log(registration.id) // "hint:custom-guide/0"
console.log(registration.constraint) // LayoutConstraint object
```

### Using Hint Builder Helpers

The `hint_builder_helpers` module provides ConstraintSpec generators for common layout patterns:

```typescript
import {
  createArrangeHorizontalSpec,
  createAlignLeftSpec,
} from "kiwumil/dsl"

context.hints.register("layout", (builder) => {
  const targets = [
    { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
    { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
  ]
  
  // Use a helper spec directly
  builder.setConstraint(createArrangeHorizontalSpec(targets, 20))
  
  return builder.layout()
})
```

## Available Helper Functions

All helper functions return `ConstraintSpec` that can be used with `setConstraint()`.

### Arrangement Helpers

- `createArrangeHorizontalSpec(targets, gap)` - Arrange symbols left to right
- `createArrangeVerticalSpec(targets, gap)` - Arrange symbols top to bottom

### Alignment Helpers

- `createAlignLeftSpec(targets)` - Align left edges
- `createAlignRightSpec(targets)` - Align right edges
- `createAlignTopSpec(targets)` - Align top edges
- `createAlignBottomSpec(targets)` - Align bottom edges
- `createAlignCenterXSpec(targets)` - Align horizontal centers
- `createAlignCenterYSpec(targets)` - Align vertical centers
- `createAlignWidthSpec(targets)` - Make widths equal
- `createAlignHeightSpec(targets)` - Make heights equal

### Container Helpers

- `createEncloseSpec(container, children)` - Container encompasses children

## Advanced Usage

### Combining Multiple Constraint Specs

Since `setConstraint()` accepts a ConstraintSpec (a callback function), you can combine multiple specs by calling them sequentially:

```typescript
context.hints.register("complex-layout", (builder) => {
  const targets = [rect1, rect2, rect3].map(r => ({
    boundId: r.bounds.boundId,
    bounds: r.bounds,
  }))
  
  builder.setConstraint((cb) => {
    // Combine multiple specs
    createArrangeVerticalSpec(targets, 10)(cb)
    createAlignCenterXSpec(targets)(cb)
  })
  
  return builder.layout()
})
```

### Creating Custom Variables

```typescript
context.hints.register("guide-system", (builder) => {
  // Create multiple variables
  const leftGuide = builder.createVariable("left")
  const rightGuide = builder.createVariable("right")
  
  builder.setConstraint((cb) => {
    // Set guide positions
    cb.ct([1, leftGuide]).eq([100, 1]).strong()
    cb.ct([1, rightGuide]).eq([400, 1]).strong()
    
    // Align symbols to guides
    cb.ct([1, rect1.bounds.x]).eq([1, leftGuide]).strong()
    cb.ct([1, rect2.bounds.right]).eq([1, rightGuide]).strong()
  })
  
  return builder.layout()
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
  console.log(`Constraint: ${registration.constraint}`)
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

## Comparison with SymbolRegistration

| Feature | SymbolRegistration | UserHintRegistration |
|---------|-------------------|---------------------|
| ID Generation | `plugin:name/index` | `hint:name/index` |
| ID Counter | `registrations.length` | `registrations.length` |
| Registration Type | `{ symbol, characs, constraint }` | `{ id, constraint }` |
| Builder Method | `createVariable(key)` | `createVariable(variableId)` |
| Constraint Setting | `setConstraint(spec)` | `setConstraint(spec)` |
| Build Validation | Checks all fields set | Checks constraint set |

## Benefits

1. **Consistency**: Follows the same pattern as SymbolRegistration
2. **Simplicity**: Single constraint per registration keeps it focused
3. **Flexibility**: Variables can be created and used within the constraint
4. **Type Safety**: Full TypeScript support with type inference
5. **Inspectability**: All registrations can be queried by ID
6. **Composability**: Constraint specs can be combined easily

## See Also

- [Layout System](./layout-system.md) - Core layout constraint system
- [Layout Hints API](./layout-hints.md) - High-level hint API documentation
