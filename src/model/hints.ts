import type { Theme } from "../theme"
import type { IConstraintsBuilder, ILayoutSolver, ILayoutConstraint, ILayoutVariable } from "../core"
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
  /** The created LayoutVariable */
  variable: ILayoutVariable
  /** Full variable name with hint: prefix */
  name: string
  /** Constraint IDs associated with this hint variable (if any) */
  constraintIds: string[]
}

export class Hints {
  private readonly constraints: ILayoutConstraint[] = []
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
    })

    this.constraints.push(constraint)
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
    })

    this.constraints.push(constraint)
  }

  alignLeft(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignLeft", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder.expr([1, bounds.x]).eq([1, refBounds.x]).strong()
      }
    })

    this.constraints.push(constraint)
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
    })

    this.constraints.push(constraint)
  }

  alignTop(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignTop", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder.expr([1, bounds.y]).eq([1, refBounds.y]).strong()
      }
    })

    this.constraints.push(constraint)
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
    })

    this.constraints.push(constraint)
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
    })

    this.constraints.push(constraint)
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
    })

    this.constraints.push(constraint)
  }

  alignWidth(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignWidth", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder.expr([1, bounds.width]).eq([1, refBounds.width]).strong()
      }
    })

    this.constraints.push(constraint)
  }

  alignHeight(targets: HintTarget[]) {
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const constraint = this.solver.createConstraint("constraints/alignHeight", (builder) => {
      for (const target of targets.slice(1)) {
        const bounds = target.layout
        builder.expr([1, bounds.height]).eq([1, refBounds.height]).strong()
      }
    })

    this.constraints.push(constraint)
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
    })

    this.constraints.push(constraint)
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
  ): ILayoutConstraint {
    const actualGap = gap ?? this.theme.defaultStyleSet.horizontalGap
    return this.solver.createConstraint("constraints/arrangeHorizontal", (builder) => {
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
    })
  }

  private createArrangeVerticalConstraints(
    targets: HintTarget[],
    gap?: number
  ): ILayoutConstraint {
    const actualGap = gap ?? this.theme.defaultStyleSet.verticalGap
    return this.solver.createConstraint("constraints/arrangeVertical", (builder) => {
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
    })
  }

  private createAlignCenterXConstraints(targets: HintTarget[]): ILayoutConstraint | null {
    if (targets.length < 2) return null

    const firstBounds = targets[0]!.layout
    return this.solver.createConstraint("constraints/alignCenterX", (builder) => {
      for (let i = 1; i < targets.length; i++) {
        const currentBounds = targets[i]!.layout

        builder
          .expr([1, currentBounds.x], [0.5, currentBounds.width])
          .eq([1, firstBounds.x], [0.5, firstBounds.width])
          .strong()
      }
    })
  }

  private createAlignRightConstraints(targets: HintTarget[]): ILayoutConstraint | null {
    if (targets.length < 2) return null

    const firstBounds = targets[0]!.layout
    return this.solver.createConstraint("constraints/alignRight", (builder) => {
      for (let i = 1; i < targets.length; i++) {
        const currentBounds = targets[i]!.layout

        builder
          .expr([1, currentBounds.x], [1, currentBounds.width])
          .eq([1, firstBounds.x], [1, firstBounds.width])
          .strong()
      }
    })
  }

}
