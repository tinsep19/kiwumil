# ActorSymbol Layout Constraint Update

## Overview

This document describes the updated constraint system for the `ActorSymbol` class, which aligns the layout logic with the framework's constraint-based layout principles.

## Changes

### Type System

1. **ActorSymbolCharacs**: Made `stereotype` field required (previously optional)
   - All actors now have a stereotype bounds, even if no stereotype text is provided
   - When no stereotype text is provided, the stereotype TextItem has empty text ""

2. **ActorSymbolOptions**: `stereotype` field remains optional
   - Backward compatibility maintained - users can still create actors without stereotypes

### Layout Constraints

The new constraint system uses `bounds.centerX` and `bounds.centerY` for alignment and implements a clear hierarchy of constraint strengths:

#### Strong Constraints

1. **Icon Centering**: Icon's center aligns with bounds' center
   - `icon.centerX = bounds.centerX`
   - `icon.centerY = bounds.centerY`

2. **Icon Size**: Icon dimensions match IconMeta
   - `icon.width = iconMeta.width`
   - `icon.height = iconMeta.height`

3. **Stereotype Positioning**: Stereotype's bottom center aligns with icon's top center
   - `stereotype.centerX = icon.centerX`
   - `stereotype.bottom = icon.top`

4. **Label Positioning**: Label's top center aligns with icon's bottom center
   - `label.centerX = icon.centerX`
   - `label.top = icon.bottom`

#### Medium Constraints

1. **Item Sizes**: Minimum sizes for text items
   - `stereotype.width >= stereotypeDefaultSize.width`
   - `stereotype.height >= stereotypeDefaultSize.height`
   - `label.width >= labelDefaultSize.width`
   - `label.height >= labelDefaultSize.height`

2. **Bounds Sizing**: Bounds must be large enough to contain all items
   - `bounds.width >= max(icon.width, stereotype.width, label.width)`
   - `bounds.height >= stereotype.height + icon.height + label.height`

#### Weak Constraints

1. **Default Sizes**: Suggested default sizes for text items
   - `stereotype.width = stereotypeDefaultSize.width` (weak)
   - `stereotype.height = stereotypeDefaultSize.height` (weak)
   - `label.width = labelDefaultSize.width` (weak)
   - `label.height = labelDefaultSize.height` (weak)

2. **Bounds Auto-expansion**: Minimal initial size suggestion
   - `bounds.width >= 1` (weak)
   - `bounds.height >= 1` (weak)

### Key Design Decisions

1. **No Explicit "Fit Within Bounds" Constraints**: Since all items are centered at `bounds.centerX`, they automatically fit within bounds when bounds is sized appropriately. Explicit containment constraints (`bounds.left <= item.left`) were found to over-constrain the system and prevent proper layout when used with guide-based alignment.

2. **Stereotype Size Handling**: When no stereotype text is provided, the default size is set to `{width: 0, height: 0}` to avoid unnecessary spacing.

3. **Constraint Strength Rationale**:
   - **Strong**: Used for positional relationships that define the actor's structure
   - **Medium**: Used for sizing constraints that should be satisfied but can be overridden by layout hints
   - **Weak**: Used for default suggestions that can easily be overridden

## Testing

All existing tests pass (218/218), including:
- Actor creation with and without stereotypes
- Horizontal and vertical arrangement
- Guide-based alignment
- SVG rendering with proper XML escaping

## Example Usage

```typescript
// Actor without stereotype
const user = el.uml.actor("User")

// Actor with stereotype
const admin = el.uml.actor({ label: "Administrator", stereotype: "primary" })
```

Both cases now create a stereotype bounds internally, but only render stereotype text when provided.
