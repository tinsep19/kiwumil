# Kiwumil Core Domain Definition v0.2.0

## Vision Statement

Kiwumil is a **Domain Translation Engine** that bridges human layout thinking and constraint-based layout solving. Its core value is not in solving constraints or rendering diagrams, but in providing an expressive vocabulary for layout intent and faithfully translating that vocabulary into correct, composable constraint equations.

## What Kiwumil Is and Is NOT

### What Kiwumil IS:
- **A layout semantics vocabulary**: Provides concepts like alignment, spacing, grouping, hierarchy, flow
- **A domain translation engine**: Converts layout semantics into Cassowary constraint equations
- **A type-safe DSL**: Offers fluent, compile-time-checked APIs for expressing layout intent
- **A composition framework**: Enables combining layout semantics in predictable ways

### What Kiwumil is NOT:
- **Not a constraint solver**: Delegates solving to Cassowary algorithm
- **Not a rendering engine**: Delegates rendering to SVG/Canvas/WebGL
- **Not a layout optimizer**: Doesn't search for "better" layouts, translates intent faithfully
- **Not a diagram framework**: Provides layout primitives, not diagram-specific semantics

## Domain-Driven Design Perspective

### Domain Layers

```
┌─────────────────────────────────────────────────────┐
│         Layout Semantics (Core Domain)             │
│  • Alignment, Spacing, Grouping, Hierarchy, Flow   │
│  • Human-oriented layout vocabulary                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│   Constraint Translation (Core Domain - ENGINE)     │
│  • Semantics → Constraint Equations                │
│  • Translation Rules & Patterns                     │
│  • Composition & Conflict Resolution                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      Supporting Domains                             │
│  • Type-Safe DSL (fluent builders, IntelliSense)   │
│  • Symbol Model (layout objects, properties)       │
│  • Testing Framework (translation verification)    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      Generic Subdomains (Infrastructure)            │
│  • Cassowary Solver (constraint solving)           │
│  • SVG Rendering (visual output)                   │
│  • Build & Tooling (TypeScript, testing, bundling) │
└─────────────────────────────────────────────────────┘
```

## Core Domain: Layout Semantics → Constraint Translation

### Input Language: Layout Vocabulary

The layout vocabulary consists of semantic categories that express human layout intent:

#### 1. Alignment Semantics
- **Horizontal**: left, center, right, justify
- **Vertical**: top, middle, bottom, baseline
- **Reference**: align to other elements, containers, or guides

**Examples**:
```typescript
// Semantic intent
align(box).left.to(container.left);
align(box).center.to(container.center);
align([box1, box2, box3]).top();
```

#### 2. Spacing Semantics
- **Fixed**: exact distances between elements
- **Proportional**: relative spacing based on ratios
- **Minimum/Maximum**: constrained ranges

**Examples**:
```typescript
// Semantic intent
space(box1, box2).horizontal(20);
space(boxes).distribute.evenly();
space(box).from(container).min(10);
```

#### 3. Grouping Semantics
- **Containers**: bounding box relationships
- **Clusters**: proximity-based grouping
- **Layering**: z-order and containment

**Examples**:
```typescript
// Semantic intent
contain(box).within(container);
group([box1, box2]).as('cluster');
```

#### 4. Hierarchy Semantics
- **Parent-Child**: containment relationships
- **Flow**: directional relationships (above, below, before, after)
- **Nesting**: recursive containment

**Examples**:
```typescript
// Semantic intent
box1.above(box2);
box2.inside(container);
flow([box1, box2, box3]).vertical();
```

#### 5. Balance Semantics
- **Distribution**: even spacing, equal sizes
- **Symmetry**: mirror relationships
- **Weight**: proportional allocation

**Examples**:
```typescript
// Semantic intent
distribute(boxes).horizontally().evenly();
balance(box1, box2).around(centerLine);
```

### Output Language: Constraint Equations

The translation engine converts semantics into Cassowary constraints:

#### Constraint Types:
- **Equality constraints**: `variable = expression`
- **Inequality constraints**: `variable >= expression`, `variable <= expression`
- **Strength modifiers**: required, strong, medium, weak
- **Composition operators**: AND, priority ordering

### Translation Rules with Examples

#### Rule 1: Align Left
**Semantic**: `align(box).left.to(container.left)`

**Translation**:
```typescript
// Constraint equation
box.x == container.x  [strength: required]
```

#### Rule 2: Align Center Horizontally
**Semantic**: `align(box).center.to(container.center)`

**Translation**:
```typescript
// Constraint equations
box.x + box.width / 2 == container.x + container.width / 2  [strength: required]
```

#### Rule 3: Fixed Horizontal Spacing
**Semantic**: `space(box1, box2).horizontal(20)`

**Translation**:
```typescript
// Constraint equation
box2.x == box1.x + box1.width + 20  [strength: required]
```

#### Rule 4: Distribute Evenly
**Semantic**: `distribute([box1, box2, box3]).horizontally().evenly()`

**Translation**:
```typescript
// For n boxes, create n-1 spacing constraints
let spacing = (container.width - sum(box.widths)) / (n + 1);

box1.x == container.x + spacing  [strength: required]
box2.x == box1.x + box1.width + spacing  [strength: required]
box3.x == box2.x + box2.width + spacing  [strength: required]
```

#### Rule 5: Vertical Flow
**Semantic**: `flow([box1, box2, box3]).vertical(gap: 10)`

**Translation**:
```typescript
// Sequential constraints
box2.y == box1.y + box1.height + 10  [strength: required]
box3.y == box2.y + box2.height + 10  [strength: required]
```

### Composition Patterns

#### Pattern 1: Combining Alignment and Spacing
```typescript
// Semantic
align(box).center.to(container.center);
space(box).from(container.top).fixed(20);

// Translation: Multiple constraints that work together
box.y == container.y + 20  [required]
box.x + box.width/2 == container.x + container.width/2  [required]
```

#### Pattern 2: Hierarchical Containment with Padding
```typescript
// Semantic
contain(box).within(container).padding(10);

// Translation: Four inequality constraints
box.x >= container.x + 10  [required]
box.y >= container.y + 10  [required]
box.x + box.width <= container.x + container.width - 10  [required]
box.y + box.height <= container.y + container.height - 10  [required]
```

#### Pattern 3: Conflict Resolution via Strength
```typescript
// Semantic: Prefer center, but stay within bounds
align(box).center.to(container.center).strength('strong');
contain(box).within(container).strength('required');

// Translation: Required constraints take precedence
box.x >= container.x  [required]
box.x + box.width <= container.x + container.width  [required]
box.x + box.width/2 == container.x + container.width/2  [strong]
// If conflict, solver satisfies required constraints first
```

## Supporting Domains

### 1. Type-Safe DSL
**Purpose**: Developer-friendly API surface for layout semantics

**Responsibilities**:
- Fluent builder patterns for semantic expression
- TypeScript type checking for semantic validity
- IntelliSense support for discoverability
- Namespace organization for plugin system

**Example**:
```typescript
import { layout } from 'kiwumil';

layout()
  .align(box).center.to(container)
  .space(box1, box2).horizontal(20)
  .build();
```

### 2. Symbol Model
**Purpose**: Abstract representation of layout objects

**Responsibilities**:
- Define layout properties (x, y, width, height)
- Track symbol relationships
- Manage variable bindings to Cassowary

**Example**:
```typescript
class LayoutSymbol {
  x: Variable;
  y: Variable;
  width: Variable;
  height: Variable;
  
  // Derived properties
  get centerX() { return this.x + this.width / 2; }
  get centerY() { return this.y + this.height / 2; }
  get right() { return this.x + this.width; }
  get bottom() { return this.y + this.height; }
}
```

### 3. Testing Framework
**Purpose**: Verify correctness of semantic translations

**Responsibilities**:
- Unit tests for individual translation rules
- Property-based tests for semantic invariants
- Integration tests for composition patterns
- Regression tests for solved layouts

## Generic Subdomains (Infrastructure)

### 1. Cassowary Constraint Solver
**Role**: Infrastructure for solving constraint systems

**Kiwumil does NOT**:
- Modify Cassowary algorithm
- Optimize solving performance
- Implement alternative solvers

**Kiwumil DOES**:
- Generate correct constraint equations
- Set appropriate strength values
- Handle solver API interactions

### 2. SVG Rendering
**Role**: Infrastructure for visual output

**Kiwumil does NOT**:
- Implement custom rendering logic
- Optimize rendering performance
- Provide styling capabilities

**Kiwumil DOES**:
- Apply solved variable values to SVG
- Update DOM based on layout results
- Bridge layout and rendering

### 3. Build & Tooling
**Role**: Infrastructure for development

**Responsibilities**:
- TypeScript compilation
- Testing infrastructure
- Package management
- Documentation generation

## Key Insights: Kiwumil's Value Proposition

### What Makes Kiwumil Valuable

1. **Semantic Abstraction**: Hide constraint complexity behind intuitive layout vocabulary
2. **Translation Correctness**: Guarantee that semantics map to correct constraints
3. **Composition**: Enable combining layout rules predictably
4. **Type Safety**: Catch semantic errors at compile time, not runtime
5. **Developer Experience**: Make constraint-based layout approachable

### What is NOT Kiwumil's Job

1. **Solving**: That's Cassowary's job
2. **Rendering**: That's SVG/Canvas/WebGL's job
3. **Optimization**: Faithfully translate intent, don't second-guess
4. **Diagram Logic**: Provide layout primitives, not domain-specific features

### The Translation Engine Metaphor

Think of Kiwumil as a compiler:

- **Source Language**: Layout semantics (human-oriented)
- **Target Language**: Constraint equations (solver-oriented)
- **Compiler**: Translation rules and patterns
- **Runtime**: Cassowary solver

Just as a compiler's value is in correct translation (not in CPU architecture or assembly optimization), Kiwumil's value is in correct semantic translation (not in solving algorithms or rendering techniques).

## Design Principles

1. **Semantics-Driven**: Every API should express semantic intent, not implementation details
2. **Translation-First**: Focus on correctness of semantic-to-constraint mapping
3. **Composable**: Layout semantics should combine without special-casing
4. **Declarative**: Express what, not how
5. **Solver-Agnostic**: Could theoretically swap Cassowary for another solver
6. **Minimal**: Provide essential layout vocabulary, not every possible feature

## References to Codebase

- **Semantics**: `src/hint/` (historical, may be refactored)
- **DSL**: `src/dsl/` (builder patterns, fluent API)
- **Translation**: Core engine (to be implemented in v0.2.0)
- **Testing**: `test/` (translation verification tests)

## Version History

- **v0.2.0**: Core domain clarification as Domain Translation Engine
- Previous versions focused on mixed concerns (rendering + layout + constraints)
