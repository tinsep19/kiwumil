# Kiwumil Development Workflow v0.2.0

## Overview

This document defines the development workflow for Kiwumil v0.2.0, organized around the core domain: **Domain Translation Engine** for layout semantics. The workflow is phase-based, with specialized agents responsible for each phase.

## Workflow Principles

1. **Semantics-First**: Always start by defining the layout semantic before designing APIs or implementing
2. **Translation-Driven**: Focus on correctness of semantic-to-constraint mapping
3. **Incremental**: Work in small, verifiable increments
4. **Agent-Specialized**: Use the right agent for each phase
5. **Documentation-Tracked**: Maintain design documentation throughout

## Development Phases

### Phase 1: Requirements & Semantics Design

**Goal**: Define what layout semantics to support and how they map to constraints

**Primary Agent**: `semantics-designer`

**Inputs**:
- User requirements or feature requests
- Layout problem descriptions
- Examples from other layout systems

**Activities**:
1. **Analyze Layout Intent**
   - Identify the human-level layout concept
   - Determine which semantic category it belongs to (alignment, spacing, grouping, hierarchy, balance)
   - Document typical use cases

2. **Define Semantic Vocabulary**
   - Name the semantic operation
   - Specify parameters and options
   - Define composition rules with other semantics

3. **Design Translation Rules**
   - Map semantic to constraint equations
   - Specify constraint strengths
   - Document edge cases and conflict resolution
   - Provide examples with actual constraint output

4. **Document Semantic Pattern**
   - Write semantic specification in `docs/design/semantics/`
   - Include examples, translation rules, and composition patterns
   - Add visual diagrams if helpful

**Outputs**:
- Semantic specification document
- Translation rules with examples
- Test scenarios for verification phase

**Integration Point**: Hand off semantic specification to Phase 2 (API Design)

---

### Phase 2: API Design

**Goal**: Design type-safe, fluent APIs for expressing the layout semantics

**Primary Agent**: `dsl-architect`

**Inputs**:
- Semantic specification from Phase 1
- Existing API patterns in `src/dsl/`
- TypeScript type system requirements

**Activities**:
1. **Design API Surface**
   - Create fluent builder methods for the semantic
   - Design method chaining patterns
   - Specify parameter types and return types

2. **Type Safety Design**
   - Define TypeScript interfaces and types
   - Create compile-time constraints where possible
   - Design error types for invalid combinations

3. **Plugin System Integration**
   - Determine namespace placement
   - Design plugin registration if needed
   - Ensure composability with existing APIs

4. **IntelliSense Optimization**
   - Write JSDoc comments for API discoverability
   - Design type signatures for autocomplete
   - Create type aliases for common patterns

5. **API Documentation**
   - Document API usage in `docs/api/`
   - Provide code examples
   - Explain type constraints

**Outputs**:
- API interface definitions (TypeScript types)
- API usage documentation
- Code examples for implementation

**Integration Point**: Hand off API specification to Phase 3 (Implementation)

---

### Phase 3: Implementation

**Goal**: Implement the constraint translation logic and DSL components

**Primary Agent**: `implementation-planner` (general-purpose)

**Inputs**:
- Semantic specification from Phase 1
- API design from Phase 2
- Existing codebase structure

**Activities**:
1. **Implement Translation Logic**
   - Create translator functions in `src/translator/` (or appropriate location)
   - Generate Cassowary constraint equations from semantic input
   - Handle constraint strength assignment
   - Implement composition logic

2. **Implement DSL Builders**
   - Create fluent builder classes in `src/dsl/`
   - Implement method chaining
   - Wire up to translation logic
   - Handle parameter validation

3. **Symbol Model Integration**
   - Update symbol classes if needed
   - Manage variable bindings
   - Track relationships between symbols

4. **Error Handling**
   - Implement validation logic
   - Create informative error messages
   - Handle edge cases gracefully

5. **Code Documentation**
   - Add inline comments for complex logic
   - Document translation algorithms
   - Explain design decisions

**Outputs**:
- Implementation code in appropriate directories
- Unit tests for translation functions
- Integration with existing codebase

**Integration Point**: Hand off implementation to Phase 4 (Verification)

---

### Phase 4: Verification

**Goal**: Verify correctness and consistency of constraint translations

**Primary Agent**: `constraint-verification-engineer`

**Inputs**:
- Implementation from Phase 3
- Test scenarios from Phase 1
- Translation rules specification

**Activities**:
1. **Write Translation Tests**
   - Unit tests for individual translation rules
   - Verify constraint equation correctness
   - Test constraint strength assignments
   - Validate composition behavior

2. **Property-Based Testing**
   - Define semantic invariants
   - Generate random valid inputs
   - Verify properties hold across all inputs
   - Test boundary conditions

3. **Solver Verification**
   - Run Cassowary solver with generated constraints
   - Verify solutions match semantic intent
   - Test for over-constrained scenarios
   - Validate under-constrained handling

4. **Regression Testing**
   - Create regression test suite
   - Document known edge cases
   - Maintain test fixtures
   - Automate test execution

5. **Integration Testing**
   - Test semantic composition
   - Verify conflict resolution
   - Test complex layout scenarios
   - Validate end-to-end workflows

**Outputs**:
- Comprehensive test suite in `test/`
- Test documentation
- Verification report
- Bug reports for Phase 3 if issues found

**Integration Point**: Iterate with Phase 3 until verification passes, then move to Phase 5

---

### Phase 5: Documentation & Release

**Goal**: Document the feature and prepare for release

**Primary Agent**: `requirements-librarian`

**Inputs**:
- Semantic specification from Phase 1
- API documentation from Phase 2
- Implementation and tests from Phases 3 & 4

**Activities**:
1. **User Documentation**
   - Write user guide in `docs/guide/`
   - Create tutorial examples
   - Document common patterns
   - Explain semantic concepts

2. **API Reference**
   - Generate API documentation from code
   - Organize by semantic category
   - Add usage examples
   - Link to related concepts

3. **Design Documentation**
   - Update architectural documentation
   - Document design decisions
   - Maintain translation rule catalog
   - Update domain model diagrams

4. **Release Notes**
   - Document new features
   - List breaking changes
   - Provide migration guide if needed
   - Acknowledge contributors

5. **Synchronize Translations**
   - Ensure Japanese documentation matches English
   - Translate new content
   - Review for technical accuracy
   - Maintain consistency

**Outputs**:
- Complete documentation set
- Release notes
- Migration guide (if applicable)
- Updated README and examples

**Integration Point**: Feature is complete and ready for release

---

## Agent Coordination

### Handoff Protocol

When handing off between phases:

1. **Document Completion Criteria**: Clearly state what was accomplished
2. **Provide Context**: Link to relevant documents and discussions
3. **List Artifacts**: Enumerate all created documents, code, tests
4. **Specify Next Steps**: Explicitly state what the next agent should do
5. **Flag Blockers**: Note any unresolved issues or dependencies

### Example Handoff (Phase 1 → Phase 2)

```markdown
## Handoff to DSL Architect (Phase 2)

**Completed**: Semantic specification for "distribute evenly" layout

**Artifacts**:
- `docs/design/semantics/distribute-evenly.md`
- Translation rules with constraint equations
- 5 test scenarios

**Semantic Summary**:
- Name: `distribute(elements).horizontally().evenly()`
- Category: Balance/Distribution
- Constraint Pattern: Equal spacing between elements

**Next Steps for DSL Architect**:
1. Design fluent API for distribute operation
2. Create TypeScript types for element collections
3. Design method chaining for direction and strategy
4. Document API in `docs/api/distribute.md`

**Blockers**: None
```

### Iteration Protocol

If verification fails or issues are discovered:

1. **Document Issue**: Create clear issue description with reproduction steps
2. **Classify Root Cause**: Semantic design, API design, or implementation bug?
3. **Return to Appropriate Phase**: 
   - Semantic issue → Phase 1
   - API design issue → Phase 2
   - Implementation bug → Phase 3
4. **Update Documentation**: Reflect lessons learned
5. **Re-verify**: Return to Phase 4 after fixes

## Workflow Diagrams

### Sequential Flow

```
┌─────────────────────────────────────────────┐
│  Phase 1: Requirements & Semantics Design   │
│  Agent: semantics-designer                  │
│  Output: Semantic specification             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Phase 2: API Design                        │
│  Agent: dsl-architect                       │
│  Output: API specification                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Phase 3: Implementation                    │
│  Agent: implementation-planner              │
│  Output: Code + unit tests                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Phase 4: Verification                      │
│  Agent: constraint-verification-engineer    │
│  Output: Test suite + verification report   │
└─────────────────────────────────────────────┘
                    ↓
              [Pass/Fail?]
                    ↓
            ┌───────┴───────┐
            ↓               ↓
         [Pass]          [Fail]
            ↓               ↓
            ↓          [Return to
            ↓           Phase 1/2/3]
            ↓               ↓
            └───────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Phase 5: Documentation & Release           │
│  Agent: requirements-librarian              │
│  Output: Complete documentation             │
└─────────────────────────────────────────────┘
```

### Parallel Activities

Some activities can happen in parallel:

- **Phase 2 (API Design)** can explore multiple API options while Phase 1 continues semantic refinement
- **Phase 4 (Verification)** can write test scaffolding before Phase 3 completes implementation
- **Phase 5 (Documentation)** can start user guides while Phase 4 runs tests

## Best Practices

### For Semantics Designer
- Focus on human-level layout concepts, not constraint mechanics
- Provide concrete examples with before/after constraint equations
- Document composition rules explicitly
- Consider edge cases and conflicts early

### For DSL Architect
- Prioritize discoverability and IntelliSense
- Use TypeScript types to prevent semantic errors
- Keep APIs fluent and chainable
- Follow existing DSL patterns for consistency

### For Implementation Planner
- Follow translation rules exactly as specified
- Add validation for semantic preconditions
- Keep translation logic separate from DSL layer
- Comment complex constraint generation logic

### For Constraint Verification Engineer
- Test translation correctness, not solver correctness
- Use property-based tests for semantic invariants
- Create regression tests for every bug found
- Document test rationale and expected behavior

### For Requirements Librarian
- Keep documentation synchronized across languages
- Use consistent terminology from semantic specifications
- Provide runnable code examples
- Link between related concepts

## Language Policy

- **Code**: English (comments, variable names, documentation strings)
- **Documentation**: English (primary), Japanese (synchronized translation)
- **Agent Communication**: Respond in the language of the request
- **Git Commits**: English
- **Issue Tracking**: English or Japanese, with translation if needed

## Quality Gates

Before moving to the next phase, ensure:

### After Phase 1:
- [ ] Semantic concept is clearly defined
- [ ] Translation rules are documented with examples
- [ ] Composition behavior is specified
- [ ] Test scenarios are outlined

### After Phase 2:
- [ ] API follows TypeScript best practices
- [ ] Type safety constraints are in place
- [ ] API documentation is complete
- [ ] Code examples are provided

### After Phase 3:
- [ ] Translation logic matches specification
- [ ] Code passes linting and type checking
- [ ] Unit tests are written
- [ ] Integration points are verified

### After Phase 4:
- [ ] All tests pass
- [ ] Translation correctness is verified
- [ ] Edge cases are handled
- [ ] Regression tests are in place

### After Phase 5:
- [ ] User documentation is complete
- [ ] API reference is generated
- [ ] Japanese translation is synchronized
- [ ] Release notes are prepared

## Tooling

- **Source Control**: Git with feature branches
- **Language**: TypeScript
- **Testing**: Jest (or configured test framework)
- **Linting**: ESLint with TypeScript
- **Documentation**: Markdown + JSDoc
- **Build**: TypeScript compiler + bundler

## Version Control Strategy

- **Feature Branches**: `feat/<semantic-name>` for new semantics
- **Documentation Branches**: `docs/<topic>` for documentation updates
- **Main Branch**: `main` for stable releases
- **Development Branch**: `develop` or `feat/v0.2.0` for integration

## Success Metrics

- **Translation Correctness**: 100% of semantic translations produce correct constraints
- **Test Coverage**: >90% coverage of translation logic
- **API Consistency**: All semantics follow common API patterns
- **Documentation Quality**: Every semantic has specification + API docs + examples
- **Type Safety**: Semantic errors caught at compile time, not runtime

## Example: Complete Workflow for "Align Center" Semantic

### Phase 1: Semantics Design
**Agent**: `semantics-designer`

**Output**: `docs/design/semantics/align-center.md`
```markdown
# Align Center Semantic

## Intent
Center an element horizontally or vertically within a reference frame.

## Vocabulary
- `align(element).center.to(reference)`
- `align(element).horizontally.center()`
- `align(element).vertically.center()`

## Translation Rules
- Horizontal: `element.x + element.width/2 == reference.x + reference.width/2`
- Vertical: `element.y + element.height/2 == reference.y + reference.height/2`
- Strength: `required` by default

## Composition
- Can combine with spacing constraints
- Compatible with containment constraints
- May conflict with fixed position constraints (use strength to resolve)
```

### Phase 2: API Design
**Agent**: `dsl-architect`

**Output**: TypeScript interface + documentation
```typescript
interface AlignmentBuilder {
  center: {
    to(reference: LayoutSymbol): Constraint;
    horizontally(): Constraint;
    vertically(): Constraint;
  };
}
```

### Phase 3: Implementation
**Agent**: `implementation-planner`

**Output**: Implementation code
```typescript
class AlignmentBuilder {
  center = {
    to: (reference: LayoutSymbol) => {
      return new Constraint(
        this.element.centerX,
        Operator.Eq,
        reference.centerX,
        Strength.required
      );
    }
  };
}
```

### Phase 4: Verification
**Agent**: `constraint-verification-engineer`

**Output**: Test suite
```typescript
describe('align().center.to()', () => {
  it('generates correct horizontal centering constraint', () => {
    const constraint = align(box).center.to(container);
    expect(constraint.expression).toBe('box.x + box.width/2 == container.x + container.width/2');
    expect(constraint.strength).toBe(Strength.required);
  });
});
```

### Phase 5: Documentation
**Agent**: `requirements-librarian`

**Output**: User guide + API reference

## Summary

This workflow ensures:
- Clear separation of concerns (semantics, API, implementation, verification, documentation)
- Right agent for each task
- Quality gates between phases
- Iterative improvement through feedback loops
- Comprehensive documentation throughout

By following this workflow, Kiwumil maintains its focus as a **Domain Translation Engine** with correct, composable semantic-to-constraint translations.
