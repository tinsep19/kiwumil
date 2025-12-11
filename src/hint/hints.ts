import * as kiwi from "@lume/kiwi"
import type { Theme } from "../theme"
import type { IConstraintsBuilder, ILayoutSolver, ILayoutConstraint, ILayoutVariable } from "../core"
import type { HintTarget } from "../core"

// Internal type that extends ILayoutConstraint with rawConstraints for internal use
interface LayoutConstraintWithRaw extends ILayoutConstraint {
  rawConstraints: kiwi.Constraint[]
}

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
  /** The created LayoutVariable */
  variable: ILayoutVariable
  /** Full variable name with hint: prefix */
  name: string
  /** Constraint IDs associated with this hint variable (if any) */
  constraintIds: string[]
}

export class Hints {
  private readonly constraints: ILayoutConstraint[] = []
  private counter = 0
  private readonly symbolCounter = new Map<string, number>()
  private readonly hintVariables: HintVariable[] = []
  private hintVarCounter = 0

  constructor(
    private readonly solver: ILayoutSolver,
    private readonly theme: Theme
  ) {}

  /**
   * Create a hint variable using the LayoutSolver API.
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
    
    // Create the variable using LayoutSolver's public API
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
   * Get all hint variables created by this Hints instance
   */
  getHintVariables(): readonly HintVariable[] {
    return [...this.hintVariables]
  }

  list(): ILayoutConstraint[] {
    return [...this.constraints]
  }

  arrangeHorizontal(
    targets: HintTarget[],
    gap = this.theme.defaultStyleSet.horizontalGap
  ) {
    const constraint = this.solver.createConstraint("constraints/arrangeHorizontal", (builder) => {
      for (let i = 0; i < targets.length - 1; i++) {
        const current = targets[i]!
        const next = targets[i + 1]!
        const aBounds = current.layout
        const bBounds = next.layout

        builder
          .expr([1, bBounds.x])
          .eq([1, aBounds.x], [1, aBounds.width], [gap, 1])
          .strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  arrangeVertical(targets: HintTarget[], gap = this.theme.defaultStyleSet.verticalGap) {
    const constraint = this.solver.createConstraint("constraints/arrangeVertical", (builder) => {
      for (let i = 0; i < targets.length - 1; i++) {
        const current = targets[i]!
        const next = targets[i + 1]!
        const aBounds = current.layout
        const bBounds = next.layout

        builder
          .expr([1, bBounds.y])
          .eq([1, aBounds.y], [1, aBounds.height], [gap, 1])
          .strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignLeft(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignLeft", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder.expr([1, bounds.x]).eq([1, refBounds.x]).strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignRight(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignRight", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder
          .expr([1, bounds.x], [1, bounds.width])
          .eq([1, refBounds.x], [1, refBounds.width])
          .strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignTop(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignTop", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder.expr([1, bounds.y]).eq([1, refBounds.y]).strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignBottom(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignBottom", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder
          .expr([1, bounds.y], [1, bounds.height])
          .eq([1, refBounds.y], [1, refBounds.height])
          .strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignCenterX(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignCenterX", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder
          .expr(
            [1, bounds.x],
            [0.5, bounds.width]
          )
          .eq(
            [1, refBounds.x],
            [0.5, refBounds.width]
          )
          .strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignCenterY(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignCenterY", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder
          .expr(
            [1, bounds.y],
            [0.5, bounds.height]
          )
          .eq(
            [1, refBounds.y],
            [0.5, refBounds.height]
          )
          .strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignWidth(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignWidth", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder.expr([1, bounds.width]).eq([1, refBounds.width]).strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignHeight(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignHeight", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder.expr([1, bounds.height]).eq([1, refBounds.height]).strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
  }

  alignSize(targets: HintTarget[]) {
    this.alignWidth(targets)
    this.alignHeight(targets)
  }

  enclose(container: HintTarget, childTargets: HintTarget[]) {
    const containerBounds = container.container ?? container.layout

    const constraint = this.solver.createConstraint("constraints/enclose", (builder) => {
      for (const child of childTargets) {
        const childBounds = child.layout

        builder
          .expr([1, childBounds.x])
          .ge([1, containerBounds.x])
          .required()
        builder
          .expr([1, childBounds.y])
          .ge([1, containerBounds.y])
          .required()
        builder
          .expr([1, containerBounds.x], [1, containerBounds.width])
          .ge([1, childBounds.x], [1, childBounds.width])
          .required()
        builder
          .expr([1, containerBounds.y], [1, containerBounds.height])
          .ge([1, childBounds.y], [1, childBounds.height])
          .required()
        
        // Z-index depth constraint: child.z >= container.z + 1
        builder
          .expr([1, childBounds.z])
          .ge([1, containerBounds.z], [1, 1])
          .strong()
      }
    }) as LayoutConstraintWithRaw

    this.record(constraint.rawConstraints)
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

    const raws: kiwi.Constraint[] = []

    // 各行を水平配置
    for (const row of matrix) {
      const rowRaws = this.createArrangeHorizontalConstraints(row, colGap)
      raws.push(...rowRaws)
    }

    // 各列を垂直配置
    const numCols = matrix[0]?.length ?? 0
    if (numCols === 0) {
      this.record(raws, container.boundId)
      return
    }

    for (let col = 0; col < numCols; col++) {
      const column = matrix
        .map((row) => row[col])
        .filter((target): target is HintTarget => Boolean(target))
      if (column.length === 0) continue
      const colRaws = this.createArrangeVerticalConstraints(column, rowGap)
      raws.push(...colRaws)
    }

    this.record(raws, container.boundId)
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

    const raws: kiwi.Constraint[] = []

    // 各行を水平配置
    for (const row of rows) {
      const rowRaws = this.createArrangeHorizontalConstraints(row)
      raws.push(...rowRaws)
    }

    // 各行の先頭（または中央/右）を縦配置
    const anchors = rows
      .map((row) => row[0])
      .filter((target): target is HintTarget => Boolean(target))
    if (anchors.length > 0) {
      const anchorRaws = this.createArrangeVerticalConstraints(anchors, rowGap)
      raws.push(...anchorRaws)
    }

    // Alignment 対応（将来実装）
    if (options?.align === "center") {
      const alignRaws = this.createAlignCenterXConstraints(children)
      raws.push(...alignRaws)
    } else if (options?.align === "right") {
      const alignRaws = this.createAlignRightConstraints(children)
      raws.push(...alignRaws)
    }

    this.record(raws, container.boundId)
  }

  private createArrangeHorizontalConstraints(
    targets: HintTarget[],
    gap?: number
  ): kiwi.Constraint[] {
    const actualGap = gap ?? this.theme.defaultStyleSet.horizontalGap
    const constraint = this.solver.createConstraint("constraints/arrangeHorizontal", (builder) => {
      for (let i = 0; i < targets.length - 1; i++) {
        const current = targets[i]!
        const next = targets[i + 1]!
        const currentBounds = current.layout
        const nextBounds = next.layout

        builder
          .expr([1, nextBounds.x])
          .eq(
            [1, currentBounds.x],
            [1, currentBounds.width],
            [actualGap, 1]
          )
          .strong()
      }
    }) as LayoutConstraintWithRaw

    return constraint.rawConstraints
  }

  private createArrangeVerticalConstraints(
    targets: HintTarget[],
    gap?: number
  ): kiwi.Constraint[] {
    const actualGap = gap ?? this.theme.defaultStyleSet.verticalGap
    const constraint = this.solver.createConstraint("constraints/arrangeVertical", (builder) => {
      for (let i = 0; i < targets.length - 1; i++) {
        const current = targets[i]!
        const next = targets[i + 1]!
        const currentBounds = current.layout
        const nextBounds = next.layout

        builder
          .expr([1, nextBounds.y])
          .eq(
            [1, currentBounds.y],
            [1, currentBounds.height],
            [actualGap, 1]
          )
          .strong()
      }
    }) as LayoutConstraintWithRaw

    return constraint.rawConstraints
  }

  private createAlignCenterXConstraints(targets: HintTarget[]): kiwi.Constraint[] {
    if (targets.length < 2) return []

    const firstBounds = targets[0]!.layout
    const constraint = this.solver.createConstraint("constraints/alignCenterX", (builder) => {
      for (let i = 1; i < targets.length; i++) {
        const currentBounds = targets[i]!.layout

        builder
          .expr([1, currentBounds.x], [0.5, currentBounds.width])
          .eq([1, firstBounds.x], [0.5, firstBounds.width])
          .strong()
      }
    }) as LayoutConstraintWithRaw

    return constraint.rawConstraints
  }

  private createAlignRightConstraints(targets: HintTarget[]): kiwi.Constraint[] {
    if (targets.length < 2) return []

    const firstBounds = targets[0]!.layout
    const constraint = this.solver.createConstraint("constraints/alignRight", (builder) => {
      for (let i = 1; i < targets.length; i++) {
        const currentBounds = targets[i]!.layout

        builder
          .expr([1, currentBounds.x], [1, currentBounds.width])
          .eq([1, firstBounds.x], [1, firstBounds.width])
          .strong()
      }
    }) as LayoutConstraintWithRaw

    return constraint.rawConstraints
  }

  private record(raws: kiwi.Constraint[], ownerId?: string) {
    if (raws.length === 0) return
    const constraint: LayoutConstraintWithRaw = {
      id: ownerId ? this.createSymbolScopedId(ownerId) : this.createId(),
      rawConstraints: raws,
    }
    this.constraints.push(constraint)
  }

  private createId(): string {
    return `constraints/${this.counter++}`
  }

  private createSymbolScopedId(ownerId: string): string {
    const base = String(ownerId)
    const next = this.symbolCounter.get(base) ?? 0
    this.symbolCounter.set(base, next + 1)
    return `constraints/${base}/${next}`
  }
}

export { ConstraintsBuilder } from "../layout"
