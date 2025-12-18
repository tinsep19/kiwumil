# Fluent Grid API

## Overview

The Fluent Grid API provides a declarative way to create grid-based layouts with explicit access to the grid coordinate system. This API complements the existing GridBuilder by exposing the underlying grid guides and dimension variables.

## API Design

### Creating a Grid

```typescript
const grid = hint.grid([
  [symbol1, symbol2],
  [null, symbol3],
  [null, symbol4]
])
```

The `hint.grid()` method accepts a 2D array (N×M matrix) where:
- Each element is either an `ISymbolCharacs` object or `null`
- All rows must have the same number of columns (rectangular matrix)
- `null` represents an empty cell in the grid

### Layout Methods

#### Direct Layout
```typescript
hint.grid([
  [symbol1, symbol2],
  [null, symbol3]
]).layout()
```

Applies the grid layout to the entire diagram without a container.

#### Layout with Container
```typescript
hint.grid([
  [symbol1, symbol2],
  [null, symbol3]
]).in(container)
```

Applies the grid layout within a specified container. The grid dimensions are automatically constrained to match the container's bounds.

### Grid Object Properties

The grid object returned by both `.layout()` and `.in(container)` exposes:

```typescript
{
  x: GuideBuilderX[],  // Array of size M+1 (vertical grid lines)
  y: GuideBuilderY[],  // Array of size N+1 (horizontal grid lines)
  width: Width[],      // Array of size M (column widths)
  height: Height[]     // Array of size N (row heights)
}
```

Where:
- **M** = number of columns
- **N** = number of rows

### Getting Cell Bounds

Use the `getArea()` method to access specific cell bounds:

```typescript
const cell = grid.getArea({
  top: 0,    // Top row index
  left: 0,   // Left column index
  bottom: 1, // Bottom row index (exclusive)
  right: 1   // Right column index (exclusive)
})

// Returns: { left, top, right, bottom } with Variable references
```

The indices are 0-based and follow grid line numbering. You can span multiple cells by specifying different top/bottom or left/right values.

## Constraint Definitions

### Width/Height Sum Constraints

When using `.in(container)`, the grid automatically creates required constraints:

```
container.bounds.width = w1 + w2 + w3 + ... + wM
container.bounds.height = h1 + h2 + h3 + ... + hN
```

### Position Constraints

Grid positions are defined by required constraints:

```
x[i+1] = x[i] + width[i]
y[i+1] = y[i] + height[i]
```

This ensures that each grid line is positioned relative to the previous line plus the cell dimension.

### Symbol Placement Constraints

For each non-null symbol at position (row, col), strong constraints ensure the symbol stays within its cell:

```
y[row] ≤ symbol.bounds.top ≤ y[row+1]
y[row] ≤ symbol.bounds.bottom ≤ y[row+1]
x[col] ≤ symbol.bounds.left ≤ x[col+1]
x[col] ≤ symbol.bounds.right ≤ x[col+1]
```

These constraints allow the symbol to be positioned anywhere within its cell while preventing it from extending beyond cell boundaries.

## Examples

### Basic 2×2 Grid

```typescript
const grid = hint.grid([
  [symbol1, symbol2],
  [symbol3, symbol4]
]).layout()

console.log(grid.x.length)  // 3 (M+1)
console.log(grid.y.length)  // 3 (N+1)
console.log(grid.width.length)  // 2 (M)
console.log(grid.height.length)  // 2 (N)
```

### Grid with Empty Cells

```typescript
hint.grid([
  [symbol1, symbol2],
  [null, symbol3],
  [null, symbol4]
]).in(container)
```

### Accessing Grid Coordinates

```typescript
const grid = hint.grid([
  [a, b, c],
  [d, e, f]
]).layout()

// Get top-left cell bounds
const cell00 = grid.getArea({ top: 0, left: 0, bottom: 1, right: 1 })

// Get entire top row
const topRow = grid.getArea({ top: 0, left: 0, bottom: 1, right: 3 })

// Get left column
const leftCol = grid.getArea({ top: 0, left: 0, bottom: 2, right: 1 })
```

## Type Safety

The API is fully type-safe:
- Matrix validation ensures rectangular shape
- Index bounds are validated in `getArea()`
- TypeScript types prevent invalid grid configurations
- Proper error messages for common mistakes

## Comparison with GridBuilder

| Feature | FluentGridBuilder | GridBuilder |
|---------|------------------|-------------|
| API Style | Direct array syntax | Builder pattern |
| Grid Access | Full coordinate system exposed | Constraints only |
| Use Case | When you need grid coordinates | Simple grid layouts |
| Container | Optional via `.in()` | Required in constructor |

## Error Handling

The API provides clear error messages for common issues:

- **Non-rectangular matrix**: Throws error if rows have different lengths
- **Empty matrix**: Throws error if the array is empty
- **Invalid indices**: `getArea()` validates all indices are in range
- **Invalid ranges**: Ensures top < bottom and left < right

## Implementation Notes

- Grid coordinates use GuideBuilder internally for flexibility
- Width and Height are branded types from the constraint system
- All grid constraints are created with appropriate strength (required or strong)
- The coordinate system integrates seamlessly with existing layout hints
