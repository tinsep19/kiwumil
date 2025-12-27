import type { Theme } from "../theme"
import type { CassowarySolver, LayoutConstraint, Variable, ConstraintSpec } from "../core"
import type { HintTarget } from "../core"

export interface HintVariableOptions {
  /**
   * Variable name suffix. If not provided, an auto-incremented counter is used.
   * Full variable name will be: hint:{baseName}_{suffix}
   */
  name?: string
  /**
   * Base name for the variable (e.g., "anchor_x", "guide_y")
   * Defaults to "var"
   */
  baseName?: string
}

export interface HintVariable {
  /** The created Variable */
  variable: Variable
  /** Full variable name with hint: prefix */
  name: string
  /** Constraint IDs associated with this hint variable (if any) */
  constraintIds: string[]
}

/**
 * UserHintRegistration: registration result type for user-created hints
 * Similar to SymbolRegistration but for layout hints
 */
export interface UserHintRegistration {
  /** Unique identifier for this hint */
  id: string
  /** Variables created for this hint */
  variables: HintVariable[]
  /** Constraints created for this hint */
  constraints: LayoutConstraint[]
}

/**
 * UserHintRegistrationBuilder:
 * Helper builder for creating user hint registrations.
 * Provides factory methods for creating variables and constraints specific to the hint.
 */
export class UserHintRegistrationBuilder {
  private readonly id: string
  private readonly hints: Hints
  private readonly _variables: HintVariable[] = []
  private readonly _constraints: LayoutConstraint[] = []

  constructor(id: string, hints: Hints) {
    this.id = id
    this.hints = hints
  }

  /**
   * Create a hint variable for this user hint.
   * The variable name will be prefixed with "hint:" automatically.
   * 
   * @param options Configuration for the hint variable
   * @returns HintVariable containing the created variable and metadata
   */
  createHintVariable(options?: HintVariableOptions): HintVariable {
    const hintVar = this.hints.createHintVariable(options)
    this._variables.push(hintVar)
    return hintVar
  }

  /**
   * Create a constraint for this user hint.
   * 
   * @param constraintId Identifier for the constraint
   * @param spec Constraint specification function
   * @returns Created LayoutConstraint
   */
  createConstraint(constraintId: string, spec: ConstraintSpec): LayoutConstraint {
    const constraint = this.hints.createConstraintForBuilder(constraintId, spec)
    this._constraints.push(constraint)
    return constraint
  }

  /**
   * Build and return the final UserHintRegistration.
   * This is called by the Hints.register method after the factory function completes.
   */
  build(): UserHintRegistration {
    return {
      id: this.id,
      variables: this._variables,
      constraints: this._constraints,
    }
  }
}

export class Hints {
  private readonly constraints: LayoutConstraint[] = []
  private readonly hintVariables: HintVariable[] = []
  private readonly registrations: UserHintRegistration[] = []
  private readonly registrations_index: Record<string, UserHintRegistration> = {}
  private hintVarCounter = 0
  private hintRegistrationCounter = 0

  constructor(
    private readonly solver: CassowarySolver,
    private readonly theme: Theme
  ) {}

  /**
   * Create a hint variable using the KiwiSolver API.
   * The variable is held in Hints scope and not registered to Symbols.
   * Variable names are automatically prefixed with "hint:".
   *
   * @param options Configuration for the hint variable
   * @returns HintVariable containing the created variable and metadata
   */
  createHintVariable(options?: HintVariableOptions): HintVariable {
    const baseName = options?.baseName ?? "var"
    const suffix = options?.name ?? `${this.hintVarCounter++}`
    const fullName = `hint:${baseName}_${suffix}`

    // Create the variable using KiwiSolver's public API
    const variable = this.solver.createVariable(fullName)

    const hintVariable: HintVariable = {
      variable,
      name: fullName,
      constraintIds: [],
    }

    this.hintVariables.push(hintVariable)
    return hintVariable
  }

  /**
   * Create a constraint for use by UserHintRegistrationBuilder.
   * This is an internal method used by the builder pattern.
   * 
   * @param constraintId Identifier for the constraint
   * @param spec Constraint specification function
   * @returns Created LayoutConstraint
   */
  createConstraintForBuilder(constraintId: string, spec: ConstraintSpec): LayoutConstraint {
    return this.solver.createConstraint(constraintId, spec)
  }

  /**
   * Register a user-created hint with variables and constraints.
   * Similar to Symbols.register, this provides a factory pattern for creating hints.
   * 
   * @param hintName Name for this hint (used to generate unique ID)
   * @param factory Factory function that receives builder and creates the hint
   * @returns UserHintRegistration containing the created hint information
   * 
   * @example
   * ```typescript
   * const registration = hints.register("custom-guide", (builder) => {
   *   const xVar = builder.createHintVariable({ baseName: "guide_x", name: "my-guide" });
   *   builder.createConstraint("guide/init", (cb) => {
   *     cb.ct([1, xVar.variable]).eq([100, 1]).strong();
   *   });
   *   return builder.build();
   * });
   * ```
   */
  register(
    hintName: string,
    factory: (builder: UserHintRegistrationBuilder) => UserHintRegistration
  ): UserHintRegistration {
    const hintId = this.createHintId(hintName)
    const builder = new UserHintRegistrationBuilder(hintId, this)
    const registration = factory(builder)

    // Validate that the returned registration matches expected ID
    if (registration.id !== hintId) {
      throw new Error(
        `UserHint registration id mismatch: expected ${hintId}, got ${registration.id}`
      )
    }

    this.registrations.push(registration)
    this.registrations_index[hintId] = registration

    // Add constraints to the main constraints list
    for (const constraint of registration.constraints) {
      this.constraints.push(constraint)
    }

    return registration
  }

  /**
   * Get all registered user hints.
   * 
   * @returns Read-only array of all UserHintRegistration objects
   */
  getAllRegistrations(): readonly UserHintRegistration[] {
    return this.registrations
  }

  /**
   * Find a registered user hint by ID.
   * 
   * @param id Hint ID to search for
   * @returns UserHintRegistration if found, undefined otherwise
   */
  findRegistrationById(id: string): UserHintRegistration | undefined {
    return this.registrations_index[id]
  }

  private createHintId(hintName: string): string {
    const idIndex = this.hintRegistrationCounter++
    return `hint:${hintName}/${idIndex}`
  }

  /**
   * Get all hint variables created by this Hints instance
   */
  getHintVariables(): readonly HintVariable[] {
    return [...this.hintVariables]
  }

  list(): LayoutConstraint[] {
    return [...this.constraints]
  }

  arrangeHorizontal(
    targets: HintTarget[],
    gap = this.theme.defaultStyleSet.horizontalGap
  ): LayoutConstraint {
    const constraint = this.solver.createConstraint("constraints/arrangeHorizontal", (builder) => {
      for (let i = 0; i < targets.length - 1; i++) {
        const current = targets[i]!
        const next = targets[i + 1]!
        const aBounds = current.bounds
        const bBounds = next.bounds

        builder.ct([1, bBounds.x]).eq([1, aBounds.x], [1, aBounds.width], [gap, 1]).strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  arrangeVertical(
    targets: HintTarget[],
    gap = this.theme.defaultStyleSet.verticalGap
  ): LayoutConstraint {
    const constraint = this.solver.createConstraint("constraints/arrangeVertical", (builder) => {
      for (let i = 0; i < targets.length - 1; i++) {
        const current = targets[i]!
        const next = targets[i + 1]!
        const aBounds = current.bounds
        const bBounds = next.bounds

        builder.ct([1, bBounds.y]).eq([1, aBounds.y], [1, aBounds.height], [gap, 1]).strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignLeft(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length === 0) return null
    const refBounds = targets[0]!.bounds

    const constraint = this.solver.createConstraint("constraints/alignLeft", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.bounds
        builder.ct([1, bounds.x]).eq([1, refBounds.x]).strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignRight(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length === 0) return null
    const refBounds = targets[0]!.bounds

    const constraint = this.solver.createConstraint("constraints/alignRight", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.bounds
        builder
          .ct([1, bounds.x], [1, bounds.width])
          .eq([1, refBounds.x], [1, refBounds.width])
          .strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignTop(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length === 0) return null
    const refBounds = targets[0]!.bounds

    const constraint = this.solver.createConstraint("constraints/alignTop", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.bounds
        builder.ct([1, bounds.y]).eq([1, refBounds.y]).strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignBottom(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length === 0) return null
    const refBounds = targets[0]!.bounds

    const constraint = this.solver.createConstraint("constraints/alignBottom", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.bounds
        builder
          .ct([1, bounds.y], [1, bounds.height])
          .eq([1, refBounds.y], [1, refBounds.height])
          .strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignCenterX(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length === 0) return null
    const refBounds = targets[0]!.bounds

    const constraint = this.solver.createConstraint("constraints/alignCenterX", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.bounds
        builder
          .ct([1, bounds.x], [0.5, bounds.width])
          .eq([1, refBounds.x], [0.5, refBounds.width])
          .strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignCenterY(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length === 0) return null
    const refBounds = targets[0]!.bounds

    const constraint = this.solver.createConstraint("constraints/alignCenterY", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.bounds
        builder
          .ct([1, bounds.y], [0.5, bounds.height])
          .eq([1, refBounds.y], [0.5, refBounds.height])
          .strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignWidth(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length === 0) return null
    const refBounds = targets[0]!.bounds

    const constraint = this.solver.createConstraint("constraints/alignWidth", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.bounds
        builder.ct([1, bounds.width]).eq([1, refBounds.width]).strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignHeight(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length === 0) return null
    const refBounds = targets[0]!.bounds

    const constraint = this.solver.createConstraint("constraints/alignHeight", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.bounds
        builder.ct([1, bounds.height]).eq([1, refBounds.height]).strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  alignSize(targets: HintTarget[]): void {
    this.alignWidth(targets)
    this.alignHeight(targets)
  }

  enclose(container: HintTarget, childTargets: HintTarget[]): LayoutConstraint {
    const containerBounds = container.container ?? container.bounds

    const constraint = this.solver.createConstraint("constraints/enclose", (builder) => {
      for (const child of childTargets) {
        const childBounds = child.bounds

        builder.ct([1, childBounds.x]).ge([1, containerBounds.x]).required()
        builder.ct([1, childBounds.y]).ge([1, containerBounds.y]).required()
        builder
          .ct([1, containerBounds.x], [1, containerBounds.width])
          .ge([1, childBounds.x], [1, childBounds.width])
          .required()
        builder
          .ct([1, containerBounds.y], [1, containerBounds.height])
          .ge([1, childBounds.y], [1, childBounds.height])
          .required()

        // Z-index depth constraint: child.z >= container.z + 1
        builder.ct([1, childBounds.z]).ge([1, containerBounds.z], [1, 1]).strong()
      }
    })

    this.constraints.push(constraint)
    return constraint
  }

  /**
   * Grid レイアウト（N×M配置）
   */
  encloseGrid(
    container: HintTarget,
    matrix: HintTarget[][],
    options?: {
      rowGap?: number
      colGap?: number
      padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
    }
  ): void {
    const children = matrix.flat()

    // 1. enclose 制約（Required）+ z-index depth constraints
    this.enclose(container, children)

    // 2. Grid 配置制約（Strong）
    const rowGap = options?.rowGap ?? this.theme.defaultStyleSet.verticalGap
    const colGap = options?.colGap ?? this.theme.defaultStyleSet.horizontalGap

    // 各行を水平配置
    for (const row of matrix) {
      const constraint = this.createArrangeHorizontalConstraints(row, colGap)
      this.constraints.push(constraint)
    }

    // 各列を垂直配置
    const numCols = matrix[0]?.length ?? 0
    if (numCols === 0) {
      return
    }

    for (let col = 0; col < numCols; col++) {
      const column = matrix
        .map((row) => row[col])
        .filter((target): target is HintTarget => Boolean(target))
      if (column.length === 0) continue
      const constraint = this.createArrangeVerticalConstraints(column, rowGap)
      this.constraints.push(constraint)
    }
  }

  /**
   * Figure レイアウト（行ごとの配置）
   */
  encloseFigure(
    container: HintTarget,
    rows: HintTarget[][],
    options?: {
      rowGap?: number
      align?: "left" | "center" | "right"
      padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
    }
  ): void {
    const children = rows.flat()

    // 1. enclose 制約（Required）+ z-index depth constraints
    this.enclose(container, children)

    // 2. 行ごとの配置制約（Strong）
    const rowGap = options?.rowGap ?? this.theme.defaultStyleSet.verticalGap

    // 各行を水平配置
    for (const row of rows) {
      const constraint = this.createArrangeHorizontalConstraints(row)
      this.constraints.push(constraint)
    }

    // 各行の先頭（または中央/右）を縦配置
    const anchors = rows
      .map((row) => row[0])
      .filter((target): target is HintTarget => Boolean(target))
    if (anchors.length > 0) {
      const constraint = this.createArrangeVerticalConstraints(anchors, rowGap)
      this.constraints.push(constraint)
    }

    // Alignment 対応（将来実装）
    if (options?.align === "center") {
      const constraint = this.createAlignCenterXConstraints(children)
      if (constraint) this.constraints.push(constraint)
    } else if (options?.align === "right") {
      const constraint = this.createAlignRightConstraints(children)
      if (constraint) this.constraints.push(constraint)
    }
  }

  private createArrangeHorizontalConstraints(
    targets: HintTarget[],
    gap?: number
  ): LayoutConstraint {
    const actualGap = gap ?? this.theme.defaultStyleSet.horizontalGap
    return this.solver.createConstraint("constraints/arrangeHorizontal", (builder) => {
      for (let i = 0; i < targets.length - 1; i++) {
        const current = targets[i]!
        const next = targets[i + 1]!
        const currentBounds = current.bounds
        const nextBounds = next.bounds

        builder
          .ct([1, nextBounds.x])
          .eq([1, currentBounds.x], [1, currentBounds.width], [actualGap, 1])
          .strong()
      }
    })
  }

  private createArrangeVerticalConstraints(targets: HintTarget[], gap?: number): LayoutConstraint {
    const actualGap = gap ?? this.theme.defaultStyleSet.verticalGap
    return this.solver.createConstraint("constraints/arrangeVertical", (builder) => {
      for (let i = 0; i < targets.length - 1; i++) {
        const current = targets[i]!
        const next = targets[i + 1]!
        const currentBounds = current.bounds
        const nextBounds = next.bounds

        builder
          .ct([1, nextBounds.y])
          .eq([1, currentBounds.y], [1, currentBounds.height], [actualGap, 1])
          .strong()
      }
    })
  }

  private createAlignCenterXConstraints(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length < 2) return null

    const firstBounds = targets[0]!.bounds
    return this.solver.createConstraint("constraints/alignCenterX", (builder) => {
      for (let i = 1; i < targets.length; i++) {
        const currentBounds = targets[i]!.bounds

        builder
          .ct([1, currentBounds.x], [0.5, currentBounds.width])
          .eq([1, firstBounds.x], [0.5, firstBounds.width])
          .strong()
      }
    })
  }

  private createAlignRightConstraints(targets: HintTarget[]): LayoutConstraint | null {
    if (targets.length < 2) return null

    const firstBounds = targets[0]!.bounds
    return this.solver.createConstraint("constraints/alignRight", (builder) => {
      for (let i = 1; i < targets.length; i++) {
        const currentBounds = targets[i]!.bounds

        builder
          .ct([1, currentBounds.x], [1, currentBounds.width])
          .eq([1, firstBounds.x], [1, firstBounds.width])
          .strong()
      }
    })
  }
}
