import * as kiwi from "@lume/kiwi"
import type { Theme } from "../theme"
import type { SymbolId, ContainerSymbolId } from "../model/types"
import {
  Operator,
  Strength,
  LayoutSolver,
  type LayoutExpressionInput,
  type LayoutTerm,
} from "./layout_solver"
import type { LayoutConstraintTarget } from "./layout_constraint_target"

// 互換性のため既存の export を維持
export const LayoutConstraintOperator = Operator
export type LayoutConstraintOperator = Operator

export const LayoutConstraintStrength = Strength
export type LayoutConstraintStrength = Strength

const LAYOUT_CONSTRAINT_ID = Symbol("LayoutConstraintId")

export type LayoutConstraintId = string & { readonly [LAYOUT_CONSTRAINT_ID]: true }

export type LayoutConstraintType =
  | "arrangeHorizontal"
  | "arrangeVertical"
  | "alignLeft"
  | "alignRight"
  | "alignTop"
  | "alignBottom"
  | "alignCenterX"
  | "alignCenterY"
  | "alignWidth"
  | "alignHeight"
  | "alignSize"
  | "enclose"
  | "encloseGrid"
  | "encloseFigure"
  | "symbolBounds"
  | "containerInbounds"

export interface LayoutConstraint {
  id: LayoutConstraintId
  type: LayoutConstraintType
  rawConstraints: kiwi.Constraint[]
}

type LayoutSymbolId = SymbolId | ContainerSymbolId

export class LayoutConstraintBuilder {
  private readonly raws: kiwi.Constraint[] = []

  constructor(private readonly solver: LayoutSolver) {}

  expression(terms?: LayoutTerm[], constant = 0) {
    return this.solver.expression(terms, constant)
  }

  eq(
    left: LayoutExpressionInput,
    right: LayoutExpressionInput,
    strength: LayoutConstraintStrength = LayoutConstraintStrength.Strong
  ) {
    this.raws.push(this.solver.addConstraint(left, LayoutConstraintOperator.Eq, right, strength))
    return this
  }

  ge(
    left: LayoutExpressionInput,
    right: LayoutExpressionInput,
    strength: LayoutConstraintStrength = LayoutConstraintStrength.Weak
  ) {
    this.raws.push(this.solver.addConstraint(left, LayoutConstraintOperator.Ge, right, strength))
    return this
  }

  getRawConstraints() {
    return this.raws
  }
}

export class LayoutConstraints {
  private readonly constraints: LayoutConstraint[] = []
  private counter = 0
  private readonly symbolCounter = new Map<string, number>()

  constructor(
    private readonly solver: LayoutSolver,
    private readonly theme: Theme
  ) {}

  list(): LayoutConstraint[] {
    return [...this.constraints]
  }

  withSymbol(
    symbolId: LayoutSymbolId,
    type: LayoutConstraintType,
    build: (builder: LayoutConstraintBuilder) => void
  ) {
    const builder = new LayoutConstraintBuilder(this.solver)

    build(builder)
    this.record(type, builder.getRawConstraints(), symbolId)
  }

  expression(terms?: LayoutTerm[], constant = 0) {
    return this.solver.expression(terms, constant)
  }

  arrangeHorizontal(
    targets: LayoutConstraintTarget[],
    gap = this.theme.defaultStyleSet.horizontalGap
  ) {
    const raws: kiwi.Constraint[] = []

    for (let i = 0; i < targets.length - 1; i++) {
      const current = targets[i]!
      const next = targets[i + 1]!
      const aBounds = current.layout
      const bBounds = next.layout

      raws.push(
        this.solver.addConstraint(
          bBounds.x,
          LayoutConstraintOperator.Eq,
          this.solver.expression([{ variable: aBounds.x }, { variable: aBounds.width }], gap),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("arrangeHorizontal", raws)
  }

  arrangeVertical(targets: LayoutConstraintTarget[], gap = this.theme.defaultStyleSet.verticalGap) {
    const raws: kiwi.Constraint[] = []

    for (let i = 0; i < targets.length - 1; i++) {
      const current = targets[i]!
      const next = targets[i + 1]!
      const aBounds = current.layout
      const bBounds = next.layout

      raws.push(
        this.solver.addConstraint(
          bBounds.y,
          LayoutConstraintOperator.Eq,
          this.solver.expression([{ variable: aBounds.y }, { variable: aBounds.height }], gap),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("arrangeVertical", raws)
  }

  alignLeft(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      raws.push(
        this.solver.addConstraint(
          bounds.x,
          LayoutConstraintOperator.Eq,
          refBounds.x,
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignLeft", raws)
  }

  alignRight(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      raws.push(
        this.solver.addConstraint(
          this.solver.expression([{ variable: bounds.x }, { variable: bounds.width }]),
          LayoutConstraintOperator.Eq,
          this.solver.expression([{ variable: refBounds.x }, { variable: refBounds.width }]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignRight", raws)
  }

  alignTop(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      raws.push(
        this.solver.addConstraint(
          bounds.y,
          LayoutConstraintOperator.Eq,
          refBounds.y,
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignTop", raws)
  }

  alignBottom(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      raws.push(
        this.solver.addConstraint(
          this.solver.expression([{ variable: bounds.y }, { variable: bounds.height }]),
          LayoutConstraintOperator.Eq,
          this.solver.expression([{ variable: refBounds.y }, { variable: refBounds.height }]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignBottom", raws)
  }

  alignCenterX(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      raws.push(
        this.solver.addConstraint(
          this.solver.expression([
            { variable: bounds.x },
            { variable: bounds.width, coefficient: 0.5 },
          ]),
          LayoutConstraintOperator.Eq,
          this.solver.expression([
            { variable: refBounds.x },
            { variable: refBounds.width, coefficient: 0.5 },
          ]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignCenterX", raws)
  }

  alignCenterY(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      raws.push(
        this.solver.addConstraint(
          this.solver.expression([
            { variable: bounds.y },
            { variable: bounds.height, coefficient: 0.5 },
          ]),
          LayoutConstraintOperator.Eq,
          this.solver.expression([
            { variable: refBounds.y },
            { variable: refBounds.height, coefficient: 0.5 },
          ]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignCenterY", raws)
  }

  alignWidth(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      raws.push(
        this.solver.addConstraint(
          bounds.width,
          LayoutConstraintOperator.Eq,
          refBounds.width,
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignWidth", raws)
  }

  alignHeight(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      raws.push(
        this.solver.addConstraint(
          bounds.height,
          LayoutConstraintOperator.Eq,
          refBounds.height,
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignHeight", raws)
  }

  alignSize(targets: LayoutConstraintTarget[]) {
    this.alignWidth(targets)
    this.alignHeight(targets)
  }

  enclose(container: LayoutConstraintTarget, childTargets: LayoutConstraintTarget[]) {
    const containerBounds = container.container ?? container.layout
    const raws: kiwi.Constraint[] = []

    for (const child of childTargets) {
      const childBounds = child.layout

      raws.push(
        this.solver.addConstraint(
          childBounds.x,
          LayoutConstraintOperator.Ge,
          containerBounds.x,
          LayoutConstraintStrength.Required
        )
      )

      raws.push(
        this.solver.addConstraint(
          childBounds.y,
          LayoutConstraintOperator.Ge,
          containerBounds.y,
          LayoutConstraintStrength.Required
        )
      )

      raws.push(
        this.solver.addConstraint(
          this.solver.expression([
            { variable: containerBounds.x },
            { variable: containerBounds.width },
          ]),
          LayoutConstraintOperator.Ge,
          this.solver.expression([{ variable: childBounds.x }, { variable: childBounds.width }]),
          LayoutConstraintStrength.Required
        )
      )

      raws.push(
        this.solver.addConstraint(
          this.solver.expression([
            { variable: containerBounds.y },
            { variable: containerBounds.height },
          ]),
          LayoutConstraintOperator.Ge,
          this.solver.expression([{ variable: childBounds.y }, { variable: childBounds.height }]),
          LayoutConstraintStrength.Required
        )
      )
    }

    this.record("enclose", raws)
  }

  /**
   * Grid レイアウト（N×M配置）
   */
  encloseGrid(
    container: LayoutConstraintTarget,
    matrix: LayoutConstraintTarget[][],
    options?: {
      rowGap?: number
      colGap?: number
      padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
    }
  ): void {
    const children = matrix.flat()

    // 1. enclose 制約（Required）
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
      this.record("encloseGrid", raws, container.boundId)
      return
    }

    for (let col = 0; col < numCols; col++) {
      const column = matrix
        .map((row) => row[col])
        .filter((target): target is LayoutConstraintTarget => Boolean(target))
      if (column.length === 0) continue
      const colRaws = this.createArrangeVerticalConstraints(column, rowGap)
      raws.push(...colRaws)
    }

    this.record("encloseGrid", raws, container.boundId)
  }

  /**
   * Figure レイアウト（行ごとの配置）
   */
  encloseFigure(
    container: LayoutConstraintTarget,
    rows: LayoutConstraintTarget[][],
    options?: {
      rowGap?: number
      align?: "left" | "center" | "right"
      padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
    }
  ): void {
    const children = rows.flat()

    // 1. enclose 制約（Required）
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
      .filter((target): target is LayoutConstraintTarget => Boolean(target))
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

    this.record("encloseFigure", raws, container.boundId)
  }

  private createArrangeHorizontalConstraints(
    targets: LayoutConstraintTarget[],
    gap?: number
  ): kiwi.Constraint[] {
    const actualGap = gap ?? this.theme.defaultStyleSet.horizontalGap
    const raws: kiwi.Constraint[] = []

    for (let i = 0; i < targets.length - 1; i++) {
      const current = targets[i]!
      const next = targets[i + 1]!
      const currentBounds = current.layout
      const nextBounds = next.layout

      raws.push(
        this.solver.addConstraint(
          nextBounds.x,
          LayoutConstraintOperator.Eq,
          this.solver.expression(
            [{ variable: currentBounds.x }, { variable: currentBounds.width }],
            actualGap
          ),
          LayoutConstraintStrength.Strong
        )
      )
    }

    return raws
  }

  private createArrangeVerticalConstraints(
    targets: LayoutConstraintTarget[],
    gap?: number
  ): kiwi.Constraint[] {
    const actualGap = gap ?? this.theme.defaultStyleSet.verticalGap
    const raws: kiwi.Constraint[] = []

    for (let i = 0; i < targets.length - 1; i++) {
      const current = targets[i]!
      const next = targets[i + 1]!
      const currentBounds = current.layout
      const nextBounds = next.layout

      raws.push(
        this.solver.addConstraint(
          nextBounds.y,
          LayoutConstraintOperator.Eq,
          this.solver.expression(
            [{ variable: currentBounds.y }, { variable: currentBounds.height }],
            actualGap
          ),
          LayoutConstraintStrength.Strong
        )
      )
    }

    return raws
  }

  private createAlignCenterXConstraints(targets: LayoutConstraintTarget[]): kiwi.Constraint[] {
    const raws: kiwi.Constraint[] = []
    if (targets.length < 2) return raws
    const first = targets[0]!
    const firstBounds = first.layout

    for (let i = 1; i < targets.length; i++) {
      const current = targets[i]!
      const currentBounds = current.layout

      raws.push(
        this.solver.addConstraint(
          this.solver.expression([
            { variable: currentBounds.x },
            { variable: currentBounds.width, coefficient: 0.5 },
          ]),
          LayoutConstraintOperator.Eq,
          this.solver.expression([
            { variable: firstBounds.x },
            { variable: firstBounds.width, coefficient: 0.5 },
          ]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    return raws
  }

  private createAlignRightConstraints(targets: LayoutConstraintTarget[]): kiwi.Constraint[] {
    const raws: kiwi.Constraint[] = []
    if (targets.length < 2) return raws

    const firstBounds = targets[0]!.layout

    for (let i = 1; i < targets.length; i++) {
      const current = targets[i]!
      const currentBounds = current.layout

      raws.push(
        this.solver.addConstraint(
          this.solver.expression([
            { variable: currentBounds.x },
            { variable: currentBounds.width },
          ]),
          LayoutConstraintOperator.Eq,
          this.solver.expression([{ variable: firstBounds.x }, { variable: firstBounds.width }]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    return raws
  }

  private record(type: LayoutConstraintType, raws: kiwi.Constraint[], ownerId?: string) {
    if (raws.length === 0) return
    const constraint: LayoutConstraint = {
      id: ownerId ? this.createSymbolScopedId(ownerId) : this.createId(),
      type,
      rawConstraints: raws,
    }
    this.constraints.push(constraint)
  }

  private createId(): LayoutConstraintId {
    return `constraints/${this.counter++}` as LayoutConstraintId
  }

  private createSymbolScopedId(ownerId: string): LayoutConstraintId {
    const base = String(ownerId)
    const next = this.symbolCounter.get(base) ?? 0
    this.symbolCounter.set(base, next + 1)
    return `constraints/${base}/${next}` as LayoutConstraintId
  }
}
