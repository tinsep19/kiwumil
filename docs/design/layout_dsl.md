# Layout DSL Vocabulary and Syntax

## Overview

The Kiwumil Layout DSL provides a fluent, declarative API for specifying layout constraints and arrangements. This document defines the core vocabulary, syntax patterns, and builder interfaces that form the foundation of the DSL.

The DSL is built on the principle of expressing **intent** rather than **coordinates**. Users describe *relationships* between elements (alignment, spacing, containment) and the constraint solver determines the actual positions.

## Core Design Principles

### 1. Fluent Interface
The DSL uses method chaining to create readable, self-documenting layout specifications:

```typescript
hint.arrange(targets)
  .x()
  .gap(20)
  .in(container)
```

### 2. Type Safety
TypeScript utility types (`Pick`, `Omit`) ensure compile-time correctness and enable precise type narrowing throughout builder chains.

### 3. Declarative Semantics
Layout code reads like natural language, describing **what** should happen, not **how** to compute positions.

---

## DSL Vocabulary

### Core Verbs

The DSL is organized around five core verbs that represent fundamental layout operations:

#### 1. `arrange`
**Purpose:** Position elements sequentially along an axis with consistent spacing.

**Semantics:**
- Takes a collection of targets
- Arranges them in order along X or Y axis
- Applies uniform gap between elements
- Can be contained within a parent

**Builder Chain:**
```typescript
arrange(targets: HintTarget[]) -> ArrangeBuilder
  .x() | .y()           // Choose axis
  .gap(space: number)   // Set spacing (optional)
  .in(container)        // Finalize in container
```

**Example:**
```typescript
// Horizontal arrangement with 30px gap
hint.arrange([a, b, c])
  .x()
  .gap(30)
  .in(container)

// Vertical arrangement with default gap
hint.arrange([a, b, c])
  .y()
  .in(container)
```

#### 2. `flow`
**Purpose:** Create flowing layouts where elements wrap to the next line/column based on available space.

**Semantics:**
- Similar to CSS flexbox with wrapping
- Primary axis defines flow direction
- Secondary axis determines wrapping behavior
- Respects container bounds

**Builder Chain:**
```typescript
flow(targets: HintTarget[]) -> FlowBuilder
  .horizontal() | .vertical()   // Primary flow direction
  .wrap(width: number)           // Wrap threshold
  .gap(space: number)            // Gap between items
  .in(container)                 // Finalize in container
```

**Example:**
```typescript
// Horizontal flow that wraps at 500px
hint.flow([a, b, c, d, e])
  .horizontal()
  .wrap(500)
  .gap(15)
  .in(container)
```

#### 3. `grid`
**Purpose:** Arrange elements in a rectangular matrix with explicit row/column structure.

**Semantics:**
- 2D array defines grid structure
- Each cell can contain a symbol or be empty (null)
- All rows must have equal columns (rectangular matrix)
- Provides access to grid coordinate system

**Builder Chain:**
```typescript
grid(matrix: Symbol[][]) -> GridBuilder
  .gap(spacing: number | { row: number, col: number })
  .layout()              // Apply to diagram
  .in(container)         // Apply within container
```

**Example:**
```typescript
// 2x2 grid with uniform gap
hint.grid([
  [a, b],
  [c, d]
])
  .gap(20)
  .layout()

// Grid with different row/column gaps
hint.grid([
  [a, b, c],
  [d, e, f]
])
  .gap({ row: 30, col: 60 })
  .in(container)
```

#### 4. `align`
**Purpose:** Align multiple elements along a specific edge or center point.

**Semantics:**
- Enforces equality constraint on specified attribute
- Does not affect other dimensions
- Can be combined with arrangement verbs

**Builder Chain:**
```typescript
align(targets: HintTarget[]) -> AlignBuilder
  .left() | .right() | .top() | .bottom()
  .centerX() | .centerY()
  .width() | .height() | .size()
```

**Example:**
```typescript
// Align left edges
hint.align([a, b, c]).left()

// Align vertical centers
hint.align([a, b, c]).centerX()

// Align both width and height
hint.align([a, b, c]).size()
```

#### 5. `enclose`
**Purpose:** Establish parent-child containment relationship with automatic sizing.

**Semantics:**
- Container automatically expands to fit children
- Applies padding around children
- Respects title space for labeled containers
- Creates strong containment constraints

**Usage:**
```typescript
enclose(container: ContainerBounds, children: HintTarget[])
```

**Example:**
```typescript
hint.enclose(container, [a, b, c])
```

---

## Builder Interfaces

### ArrangeBuilder

Provides fluent API for sequential arrangement of elements.

```typescript
interface ArrangeBuilder {
  /**
   * Arrange along X axis (horizontal)
   */
  x(): ArrangeAxisBuilder
  
  /**
   * Arrange along Y axis (vertical)
   */
  y(): ArrangeAxisBuilder
}

interface ArrangeAxisBuilder {
  /**
   * Set gap between elements (optional)
   * @param space - Distance between elements in pixels
   */
  gap(space: number): this
  
  /**
   * Finalize arrangement within a container
   * @param container - Container bounds to arrange within
   */
  in(container: ContainerBounds): void
}
```

**Implementation Pattern:**
```typescript
class ArrangeBuilderImpl implements ArrangeBuilder {
  constructor(private targets: HintTarget[]) {}
  
  x(): ArrangeAxisBuilder {
    return new ArrangeAxisBuilderImpl(this.targets, 'horizontal')
  }
  
  y(): ArrangeAxisBuilder {
    return new ArrangeAxisBuilderImpl(this.targets, 'vertical')
  }
}

class ArrangeAxisBuilderImpl implements ArrangeAxisBuilder {
  private gapValue?: number
  
  constructor(
    private targets: HintTarget[],
    private axis: 'horizontal' | 'vertical'
  ) {}
  
  gap(space: number): this {
    this.gapValue = space
    return this
  }
  
  in(container: ContainerBounds): void {
    // Apply constraints based on axis, gap, and container
    if (this.axis === 'horizontal') {
      // Create horizontal arrangement constraints
    } else {
      // Create vertical arrangement constraints
    }
  }
}
```

### FlowBuilder

Provides fluent API for flowing layouts with wrapping.

```typescript
interface FlowBuilder {
  /**
   * Set primary flow direction to horizontal
   */
  horizontal(): FlowDirectionBuilder
  
  /**
   * Set primary flow direction to vertical
   */
  vertical(): FlowDirectionBuilder
}

interface FlowDirectionBuilder {
  /**
   * Set wrap threshold
   * @param width - Maximum width/height before wrapping
   */
  wrap(width: number): this
  
  /**
   * Set gap between items
   */
  gap(space: number): this
  
  /**
   * Finalize flow layout in container
   */
  in(container: ContainerBounds): void
}
```

### GridBuilder

Already implemented. See [Fluent Grid API](./fluent-grid-api.md) for details.

**Key Methods:**
- `gap(spacing)` - Set row/column gaps
- `layout()` - Apply to entire diagram
- `in(container)` - Apply within container
- `getArea(coords)` - Access specific cell bounds

### AlignBuilder

Provides fluent API for alignment constraints.

```typescript
interface AlignBuilder {
  /**
   * Align left edges (x coordinates)
   */
  left(): void
  
  /**
   * Align right edges
   */
  right(): void
  
  /**
   * Align top edges (y coordinates)
   */
  top(): void
  
  /**
   * Align bottom edges
   */
  bottom(): void
  
  /**
   * Align horizontal centers
   */
  centerX(): void
  
  /**
   * Align vertical centers
   */
  centerY(): void
  
  /**
   * Align widths
   */
  width(): void
  
  /**
   * Align heights
   */
  height(): void
  
  /**
   * Align both width and height
   */
  size(): void
}
```

---

## TypeScript Utility Types

### Type Narrowing with Pick and Omit

The DSL uses TypeScript utility types to ensure type safety and enable precise API contracts.

#### Base Configuration Types

```typescript
/**
 * Base configuration for all layout targets
 */
interface BaseConfiguration {
  boundId: BoundId
  bounds: LayoutBounds
  container?: ContainerBounds
}

/**
 * Simplified configuration with only ID
 */
type SimpleConfiguration = Pick<BaseConfiguration, "boundId">

/**
 * Configuration without ID
 */
type BoundsOnlyConfiguration = Omit<BaseConfiguration, "boundId">

/**
 * Required fields for arrangement
 */
type ArrangeConfiguration = Pick<BaseConfiguration, "boundId" | "bounds">
```

#### Builder State Types

Builders use utility types to track required vs. optional configuration:

```typescript
/**
 * Base builder state
 */
interface BuilderState {
  targets: HintTarget[]
  axis?: 'x' | 'y'
  gap?: number
  container?: ContainerBounds
}

/**
 * State after axis is selected
 */
type WithAxis = BuilderState & { axis: 'x' | 'y' }

/**
 * State ready for finalization
 */
type ReadyState = Required<Pick<BuilderState, 'targets' | 'axis'>> & 
                  Partial<Pick<BuilderState, 'gap' | 'container'>>
```

#### Example: Type-Safe Builder

```typescript
class TypeSafeArrangeBuilder<
  TState extends Partial<BuilderState> = {}
> {
  private state: BuilderState
  
  constructor(targets: HintTarget[]) {
    this.state = { targets }
  }
  
  x(): TypeSafeArrangeBuilder<TState & { axis: 'x' }> {
    this.state.axis = 'x'
    return this as any
  }
  
  // gap() only available after axis selected
  gap(
    this: TypeSafeArrangeBuilder<{ axis: 'x' | 'y' }>,
    space: number
  ): this {
    this.state.gap = space
    return this
  }
  
  // in() requires axis to be set
  in(
    this: TypeSafeArrangeBuilder<{ axis: 'x' | 'y' }>,
    container: ContainerBounds
  ): void {
    // Finalize with type-guaranteed state
  }
}
```

### Field Selection Patterns

#### Pattern 1: Extract Minimal Fields

```typescript
// From complex symbol, extract only layout bounds
type LayoutTarget = Pick<ISymbolCharacs, "boundId" | "bounds">

function processLayout(target: LayoutTarget) {
  // Only boundId and bounds are available
}
```

#### Pattern 2: Exclude Sensitive Fields

```typescript
// Public API without internal fields
type PublicBuilder = Omit<InternalBuilder, "_state" | "_context">

export function createBuilder(): PublicBuilder {
  return new InternalBuilder()
}
```

#### Pattern 3: Conditional Fields

```typescript
// Require container only for nested layouts
type LayoutConfig<TNested extends boolean> = TNested extends true
  ? Required<Pick<BaseConfiguration, "container">>
  : Omit<BaseConfiguration, "container">

function applyLayout<T extends boolean>(
  nested: T,
  config: LayoutConfig<T>
) {
  // Type system enforces container presence based on nested flag
}
```

---

## Integration with layout_hint.ts

The `src/core/layout_hint.ts` file defines the foundational `HintTarget` interface:

```typescript
export interface HintTarget {
  readonly boundId: BoundId
  readonly bounds: LayoutBounds
  readonly container?: ContainerBounds
}
```

This interface serves as the base type for all layout operations in the DSL. It encapsulates:
- **boundId**: Unique identifier for the layout bounds
- **bounds**: The layout bounds containing position and size variables
- **container**: Optional parent container bounds for nested layouts

### Extension Strategy

To implement the DSL vocabulary, `layout_hint.ts` will be extended with:

1. **Builder Type Definitions**
   - Export builder interfaces (`ArrangeBuilder`, `FlowBuilder`, `AlignBuilder`)
   - Keep interfaces minimal and focused

2. **Type Utilities**
   - Add utility types for common field selections
   - Define builder state progression types

3. **Integration Points**
   - Ensure `HintTarget` remains the canonical target type
   - Builder implementations should accept `HintTarget` or compatible types
   - Maintain backward compatibility with existing code

**Example Extension:**

```typescript
// src/core/layout_hint.ts

export interface HintTarget {
  readonly boundId: BoundId
  readonly bounds: LayoutBounds
  readonly container?: ContainerBounds
}

// Builder interfaces
export interface ArrangeBuilder {
  x(): ArrangeAxisBuilder
  y(): ArrangeAxisBuilder
}

export interface ArrangeAxisBuilder {
  gap(space: number): this
  in(container: ContainerBounds): void
}

// Utility types
export type MinimalTarget = Pick<HintTarget, "boundId" | "bounds">
export type TargetWithContainer = Required<HintTarget>
```

---

## Usage Examples

### Example 1: Basic Arrangement

```typescript
const targets = [symbolA, symbolB, symbolC]

// Horizontal arrangement with custom gap
hint.arrange(targets)
  .x()
  .gap(50)
  .in(container)

// Equivalent to:
// symbolB.x = symbolA.x + symbolA.width + 50
// symbolC.x = symbolB.x + symbolB.width + 50
```

### Example 2: Combined Alignment and Arrangement

```typescript
const targets = [a, b, c]

// Arrange vertically
hint.arrange(targets)
  .y()
  .gap(20)
  .in(container)

// Align centers
hint.align(targets).centerX()

// Result: Vertical stack with centered elements
```

### Example 3: Grid with Custom Spacing

```typescript
hint.grid([
  [header, null, null],
  [sidebar, content, panel],
  [footer, footer, footer]
])
  .gap({ row: 15, col: 20 })
  .layout()
```

### Example 4: Flowing Layout

```typescript
const items = [item1, item2, item3, item4, item5]

hint.flow(items)
  .horizontal()
  .wrap(400)
  .gap(10)
  .in(container)

// Items flow horizontally, wrapping to new line at 400px
```

### Example 5: Complex Nested Layout

```typescript
// Top-level grid
const grid = hint.grid([
  [header],
  [body],
  [footer]
])
  .gap(20)
  .layout()

// Arrange items inside body cell
const bodyCell = grid.getArea({ top: 1, left: 0, bottom: 2, right: 1 })
const bodyItems = [item1, item2, item3]

hint.arrange(bodyItems)
  .x()
  .gap(15)
  // Use grid cell as container bounds would require additional API
```

---

## Implementation Checklist

When implementing the DSL vocabulary in `layout_hint.ts`:

- [ ] Define all builder interfaces with clear JSDoc comments
- [ ] Create utility types using `Pick` and `Omit` for field selection
- [ ] Ensure builder methods return `this` for chaining (where appropriate)
- [ ] Use TypeScript generics to track builder state progression
- [ ] Export all public types from `layout_hint.ts`
- [ ] Maintain backward compatibility with existing `HintTarget` usage
- [ ] Write comprehensive examples demonstrating each verb
- [ ] Add type-level tests using `tsd` to validate builder chains

---

## Related Documentation

- [Layout Hints API](./layout-hints.md) - High-level hint API documentation
- [Fluent Grid API](./fluent-grid-api.md) - Grid builder implementation details
- [Layout System](./layout-system.md) - Constraint solver internals
- [Architecture](./architecture.md) - Overall system design

---

## Future Enhancements

Potential additions to the DSL vocabulary:

- **`distribute`** - Evenly distribute elements within available space
- **`stack`** - Stack elements with z-ordering
- **`nest`** - Create hierarchical containment structures
- **`constrain`** - Direct constraint specification for advanced users
- **`responsive`** - Min/max constraints for adaptive layouts

These extensions would follow the same fluent builder pattern and type safety principles established in this document.
