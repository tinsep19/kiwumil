# Draft: Fluent Builder Type System Analysis

## Document Status
- **Created**: 2026-01-06
- **Type**: Initial Analysis / Investigation
- **Related Files**: 
  - `src/hint/fluent_builder_generator.ts`
  - `src/core/layout_hint.ts`
  - `tsd/fluent_optional_once.test-d.ts`

## Problem Statement from User

The user reports working on fixing the fluent builder type generator with these observations:

1. **Current Code State**: There is already logic to prevent optional methods from being called multiple times (using `K extends OPT_CONSUMED ? never : ...`)

2. **Implementation Broken**: This implementation causes the entire Chain type to resolve to `never`

3. **User Experience**: When users try to call fluent methods like `builder.arrange(targets).x()`, TypeScript reports that `.x` doesn't exist because the type is `never`

4. **Fix Attempted**: User tried using `Exclude<keyof T["optional"] & string, OPT_CONSUMED>` instead of the conditional check, but this didn't solve the underlying problem

## User's Questions

1. What is the actual requirement here? Is it to IMPLEMENT the "optional once" behavior, or to FIX an already-broken implementation?
2. Is there a design document or specification that explains how this fluent builder generator is supposed to work?
3. Are there any known issues or limitations with the current implementation?

## Investigation Findings

### 1. Design Documentation

I searched the repository for relevant documentation:

#### Found Documentation:
- **`docs/design/fluent-grid-api.md`**: Documents the FluentGridBuilder (different from the generic fluent builder system)
- **`docs/devlog/2025-12-18-fluent-grid-api.md`**: Implementation log for FluentGridBuilder
- **No specific documentation** for the generic fluent builder type system in `fluent_builder_generator.ts`

#### Type System Usage:
The `fluent_builder_generator.ts` provides a generic `Fluent<T>` type used by:
- `ArrangeBuilder` (defined in `src/core/layout_hint.ts`)
- `FlowBuilder` (defined in `src/core/layout_hint.ts`)
- `AlignBuilder` (defined in `src/core/layout_hint.ts`)

### 2. Current Implementation Analysis

From `src/hint/fluent_builder_generator.ts` (lines 1-152):

```typescript
/**
 * FluentSpec:
 * - init: 初期子（入口）。ここからチェーンが開始される
 * - required: AND必須（全て呼ぶ必要がある）
 * - requiredGroups: OR必須（各グループからどれか1つ必要）
 * - optional: 通常オプション（一回のみ可）
 * - optionalGroup: ORオプション（各グループで最大1回）
 * - terminal: 終端子（複数可）。必須を満たした時だけ呼べる
 */
```

**Key Point from Comment**: `optional: 通常オプション（一回のみ可）` - "Optional: normal optional (once only)"

This confirms that **the requirement is already defined**: optional methods should be callable at most once.

### 3. Test Expectations

From `tsd/fluent_optional_once.test-d.ts`:

```typescript
// First call to gap should work
const step3 = step2.gap(10)

// Second call to gap should NOT work
expectError(step3.gap(20))  // Line 27

// Terminal should still work
expectType<void>(step3.in(container))
```

This test **expects that calling `gap()` twice should cause a compile error**.

### 4. Current Implementation Problem

Looking at lines 121-128 of `fluent_builder_generator.ts`:

```typescript
// ---- optional（一回のみOK）----
(T["optional"] extends Record<string, Fn>
  ? {
      [K in Exclude<keyof T["optional"] & string, OPT_CONSUMED>]:
        (...a: Args<T["optional"][K]>) =>
          Chain<T, REQ, REQG, OPT_CONSUMED | K, OPTG_LOCKED>;
    }
  : Record<string, never>)
```

**Current Approach**: Uses `Exclude<keyof T["optional"] & string, OPT_CONSUMED>` to filter out consumed methods.

**The Problem**: This approach is attempting to filter consumed methods from the key space, but there's a fundamental issue with how this interacts with the rest of the type system.

### 5. Type System Behavior

The `Chain` type is an intersection of multiple record types:

```typescript
Chain<...> = 
  RequiredMethods & 
  RequiredGroupMethods & 
  OptionalMethods & 
  OptionalGroupMethods & 
  TerminalMethods
```

When TypeScript evaluates this intersection, if any of the component types has a key that maps to `never`, and that key appears in multiple components, the entire intersection can collapse to `never`.

## Root Cause Analysis

### Hypothesis 1: Initial State Problem
When `OPT_CONSUMED` is `never` (initial state), the expression:
```typescript
Exclude<keyof T["optional"] & string, OPT_CONSUMED>
// becomes
Exclude<keyof T["optional"] & string, never>
// which equals
keyof T["optional"] & string
```

This should work correctly initially. ✅

### Hypothesis 2: Post-Consumption State Problem
After calling `gap(10)`, `OPT_CONSUMED` becomes `"gap"`. The next chain would have:
```typescript
Exclude<keyof T["optional"] & string, "gap">
```

For `FlowBuilder` where `optional: { wrap: Step<...>, gap: Step<...> }`:
```typescript
Exclude<"wrap" | "gap", "gap">
// becomes
"wrap"
```

This should only expose `wrap`, which is correct. ✅

### Hypothesis 3: Intersection Conflict
The issue might be in how the intersection is computed. Let me check the required methods section (lines 96-105):

```typescript
(T["required"] extends Record<string, Fn>
  ? {
      [K in keyof T["required"] & string]:
        K extends REQ
          ? (...a: Args<T["required"][K]>) =>
              Chain<T, Exclude<REQ, K>, REQG, OPT_CONSUMED, OPTG_LOCKED>
          : never;
    }
  : Record<string, never>)
```

**AHA!** The problem is here: `K extends REQ ? ... : never`

When `REQ` is `never` (all requirements satisfied), for any key `K`:
```typescript
K extends never ? ... : never
// always evaluates to never!
```

This means after all requirements are satisfied, the required methods section becomes:
```typescript
{ [K in string]: never }
// which is equivalent to
Record<string, never>
```

### The Real Problem

The issue is that `Record<string, never>` intersected with other record types can cause the entire intersection to collapse to `never` in certain TypeScript versions or configurations.

More specifically:
```typescript
Record<string, never> & { gap: Function } 
// might collapse to never
```

This is because `Record<string, never>` is equivalent to saying "no keys are allowed", which conflicts with records that do have keys.

## Answer to User's Questions

### Question 1: Is it to IMPLEMENT or FIX?
**Answer**: It's to **FIX** an already-broken implementation. The requirement is clear from the comments and tests: optional methods should only be callable once. The implementation attempted this but has a fundamental type system flaw.

### Question 2: Is there a design document?
**Answer**: There is **no dedicated design document** for the generic fluent builder type system. The only documentation is:
- Inline comments in `fluent_builder_generator.ts` (lines 1-60)
- Usage examples in type definitions (`src/core/layout_hint.ts`)
- Type tests (`tsd/fluent_optional_once.test-d.ts`)

### Question 3: Known issues or limitations?
**Answer**: Yes, there is a **fundamental issue**:
- The conditional `K extends REQ ? ... : never` pattern causes all methods to map to `never` once requirements are satisfied
- This leads to `Record<string, never>` which can cause intersection collapse
- The issue manifests as the entire `Chain` type becoming `never`, breaking IDE autocomplete

## Proposed Solution Direction

The fix needs to avoid creating `Record<string, never>` by:

1. **Option A**: Don't map unconsumed required keys to `never`. Instead, use `Omit` or conditional types to exclude them from the record entirely.

2. **Option B**: Use a different pattern for tracking consumed state, such as:
   - Template literal types
   - Discriminated unions
   - Separate builder classes for each state

3. **Option C**: Restructure the intersection to avoid `Record<string, never>` entirely by conditionally including/excluding entire record sections.

## Recommendation

I recommend **Option A** as the most conservative fix:
- Change from mapping to `never` to actually removing keys from the type
- Use `Omit` or conditional type exclusion
- Minimal changes to existing structure

Example:
```typescript
// Instead of:
[K in keyof T["required"]]: K extends REQ ? Method : never

// Use:
[K in Extract<keyof T["required"], REQ>]: Method
```

This ensures only actually-required methods appear in the type, avoiding `never` values that cause intersection collapse.

## Next Steps

1. ✅ Complete this analysis
2. ⏳ Create a detailed design document for the fix
3. ⏳ Implement the fix with type-level debugging
4. ⏳ Verify with `tsd` tests
5. ⏳ Update documentation

## References

- `src/hint/fluent_builder_generator.ts` - Generic fluent builder implementation
- `src/core/layout_hint.ts` - Builder type definitions (ArrangeBuilder, FlowBuilder, AlignBuilder)
- `tsd/fluent_optional_once.test-d.ts` - Type tests for once-only behavior
- `tests/hint_factory_fluent.test.ts` - Runtime tests for fluent API
