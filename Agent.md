# Agent Selection Guide for Kiwumil v0.2.0

## Project Vision

Kiwumil is a **Domain Translation Engine** for diagram layout semantics. Its core competence is translating human-oriented layout semantics (alignment, grouping, hierarchy, flow, balance) into formal constraint equations solvable by the Cassowary algorithm.

### What Kiwumil IS:
- A vocabulary for expressing layout intent
- A translation engine from layout semantics to constraint systems
- A type-safe DSL for composing layout specifications

### What Kiwumil is NOT:
- A constraint solver (delegates to Cassowary)
- A rendering engine (delegates to SVG/Canvas)
- A layout optimization algorithm

## Core Domain Focus

From a Domain-Driven Design perspective:

- **Domain**: Diagram layout semantics
- **Core Domain**: Mapping layout vocabulary into constraint systems
- **Infrastructure**: Cassowary constraint solver, SVG rendering, build tools

## Agent Roles by Development Phase

### Phase 1: Requirements & Semantics Design
**Primary Agent**: `semantics-designer`
- Design layout vocabulary and semantics categories
- Define translation rules from semantics to constraints
- Document semantic patterns and their constraint representations
- Review proposals for new layout semantics

**When to use**: When defining new layout semantics, designing vocabulary, or establishing translation patterns.

### Phase 2: API Design
**Primary Agent**: `dsl-architect`
- Design type-safe, fluent APIs for layout semantics
- Create builder patterns and namespace plugins
- Ensure IntelliSense and developer experience
- Design API surface for semantic operations

**When to use**: When designing TypeScript APIs, creating fluent interfaces, or working on DSL ergonomics.

### Phase 3: Implementation
**Primary Agent**: `implementation-planner` (general-purpose)
- Implement constraint translation logic
- Build DSL components and builders
- Integrate with Cassowary solver
- Create utility functions

**When to use**: For implementing the designed semantics and APIs into working code.

### Phase 4: Verification
**Primary Agent**: `constraint-verification-engineer`
- Write translation correctness tests
- Verify constraint solver behavior
- Create property-based tests
- Implement regression tests

**When to use**: When writing tests, verifying constraint correctness, or ensuring translation accuracy.

### Phase 5: Documentation & Release
**Primary Agent**: `requirements-librarian`
- Document semantic patterns
- Create usage examples
- Maintain design documentation
- Track requirement changes

**When to use**: For documentation tasks, requirement analysis, or maintaining design specifications.

## Decision Matrix

| Task Type | Primary Agent | Secondary Agent |
|-----------|---------------|-----------------|
| Define new layout semantic | `semantics-designer` | `requirements-librarian` |
| Design DSL API for semantic | `dsl-architect` | `semantics-designer` |
| Implement constraint translation | `implementation-planner` | `semantics-designer` |
| Write translation tests | `constraint-verification-engineer` | - |
| Document semantic patterns | `requirements-librarian` | `semantics-designer` |
| Review constraint correctness | `constraint-verification-engineer` | `semantics-designer` |
| Refactor API surface | `dsl-architect` | - |
| Analyze requirements | `requirements-analyst` | `requirements-librarian` |

## Core Domain Principles

When working on Kiwumil, always remember:

1. **Semantics First**: Start with layout intent, not constraints
2. **Translation Correctness**: The mapping from semantics to constraints is the core value
3. **Composability**: Layout semantics must compose cleanly
4. **Type Safety**: The DSL should catch semantic errors at compile time
5. **Declarative**: Express what to achieve, not how to solve
6. **Solver Agnostic**: Hide Cassowary details behind semantic abstractions

## Getting Started

1. **For new layout features**: Start with `semantics-designer` to define the semantic meaning
2. **For API improvements**: Use `dsl-architect` to design the developer interface
3. **For implementation**: Use `implementation-planner` with guidance from semantic and API designs
4. **For quality assurance**: Use `constraint-verification-engineer` to ensure correctness
5. **For documentation**: Use `requirements-librarian` to maintain design docs

## Language Policy

- **Documentation**: English (primary), Japanese (secondary translations)
- **Code**: English (comments, variable names, documentation)
- **Agent Communication**: Agents respond in the language of the request
- **Design Documents**: Maintain both English and Japanese versions synchronized

## Integration Points

Agents should coordinate at these integration points:

1. **Semantics → API**: `semantics-designer` defines semantics, `dsl-architect` designs API
2. **API → Implementation**: `dsl-architect` specifies types, `implementation-planner` implements
3. **Implementation → Verification**: Implementation triggers `constraint-verification-engineer`
4. **All Phases → Documentation**: `requirements-librarian` captures all design decisions

## Quick Reference

- **Need to define what a layout semantic means?** → `semantics-designer`
- **Need to design how developers express it?** → `dsl-architect`
- **Need to build it?** → `implementation-planner`
- **Need to verify it works correctly?** → `constraint-verification-engineer`
- **Need to document it?** → `requirements-librarian`
