import * as kiwi from "@lume/kiwi"
import type { Theme } from "../theme"
import type { ContainerSymbolId, SymbolId } from "../model"
import { LayoutSolver } from "./layout_solver"
import { ConstraintsBuilder } from "./constraints_builder"
import type { LayoutConstraintTarget } from "./layout_constraint_target"

// 互換性のため既存の export を維持
export const LayoutConstraintOperator = Object.freeze({
  Eq: kiwi.Operator.Eq,
  Ge: kiwi.Operator.Ge,
  Le: kiwi.Operator.Le,
} as const)
export type LayoutConstraintOperator =
  (typeof LayoutConstraintOperator)[keyof typeof LayoutConstraintOperator]

export const LayoutConstraintStrength = Object.freeze({
  Required: kiwi.Strength.required,
  Strong: kiwi.Strength.strong,
  Weak: kiwi.Strength.weak,
} as const)
export type LayoutConstraintStrength =
  (typeof LayoutConstraintStrength)[keyof typeof LayoutConstraintStrength]

const LAYOUT_CONSTRAINT_ID = Symbol("LayoutConstraintId")

export type LayoutConstraintId = string & { readonly [LAYOUT_CONSTRAINT_ID]: true }

export interface LayoutConstraint {
  id: LayoutConstraintId
  rawConstraints: kiwi.Constraint[]
}

type LayoutSymbolId = SymbolId | ContainerSymbolId

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
    build: (builder: ConstraintsBuilder) => void
  ) {
    const builder = this.solver.createConstraintsBuilder()

    build(builder)
    this.record(builder.getRawConstraints(), symbolId)
  }

  arrangeHorizontal(
    targets: LayoutConstraintTarget[],
    gap = this.theme.defaultStyleSet.horizontalGap
  ) {
    const raws: kiwi.Constraint[] = []
    const builder = this.solver.createConstraintsBuilder()

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

    raws.push(...builder.getRawConstraints())
    this.record(raws)
  }

  arrangeVertical(targets: LayoutConstraintTarget[], gap = this.theme.defaultStyleSet.verticalGap) {
    const raws: kiwi.Constraint[] = []
    const builder = this.solver.createConstraintsBuilder()

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

    raws.push(...builder.getRawConstraints())
    this.record(raws)
  }

  alignLeft(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout
    const builder = this.solver.createConstraintsBuilder()

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      builder.expr([1, bounds.x]).eq([1, refBounds.x]).strong()
    }

    raws.push(...builder.getRawConstraints())
    this.record(raws)
  }

  alignRight(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout
    const builder = this.solver.createConstraintsBuilder()

    for (const target of targets.slice(1)) {
      const bounds = target.layout
      builder
        .expr([1, bounds.x], [1, bounds.width])
        .eq([1, refBounds.x], [1, refBounds.width])
        .strong()
    }

    raws.push(...builder.getRawConstraints())
    this.record(raws)
  }

  alignTop(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const builder = this.solver.createConstraintsBuilder()
    for (const target of targets.slice(1)) {
      const bounds = target.layout
      builder.expr([1, bounds.y]).eq([1, refBounds.y]).strong()
    }
    raws.push(...builder.getRawConstraints())

    this.record(raws)
  }

  alignBottom(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const builder = this.solver.createConstraintsBuilder()
    for (const target of targets.slice(1)) {
      const bounds = target.layout
      builder
        .expr([1, bounds.y], [1, bounds.height])
        .eq([1, refBounds.y], [1, refBounds.height])
        .strong()
    }
    raws.push(...builder.getRawConstraints())

    this.record(raws)
  }

  alignCenterX(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const builder = this.solver.createConstraintsBuilder()
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
    raws.push(...builder.getRawConstraints())

    this.record(raws)
  }

  alignCenterY(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const builder = this.solver.createConstraintsBuilder()
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
    raws.push(...builder.getRawConstraints())

    this.record(raws)
  }

  alignWidth(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const builder = this.solver.createConstraintsBuilder()
    for (const target of targets.slice(1)) {
      const bounds = target.layout
      builder.expr([1, bounds.width]).eq([1, refBounds.width]).strong()
    }
    raws.push(...builder.getRawConstraints())

    this.record(raws)
  }

  alignHeight(targets: LayoutConstraintTarget[]) {
    const raws: kiwi.Constraint[] = []
    if (targets.length === 0) return
    const refBounds = targets[0]!.layout

    const builder = this.solver.createConstraintsBuilder()
    for (const target of targets.slice(1)) {
      const bounds = target.layout
      builder.expr([1, bounds.height]).eq([1, refBounds.height]).strong()
    }
    raws.push(...builder.getRawConstraints())

    this.record(raws)
  }

  alignSize(targets: LayoutConstraintTarget[]) {
    this.alignWidth(targets)
    this.alignHeight(targets)
  }

  enclose(container: LayoutConstraintTarget, childTargets: LayoutConstraintTarget[]) {
    const containerBounds = container.container ?? container.layout
    const raws: kiwi.Constraint[] = []
    const builder = this.solver.createConstraintsBuilder()

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
    }

    raws.push(...builder.getRawConstraints())
    this.record(raws)
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
      this.record(raws, container.boundId)
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

    this.record(raws, container.boundId)
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

    this.record(raws, container.boundId)
  }

  private createArrangeHorizontalConstraints(
    targets: LayoutConstraintTarget[],
    gap?: number
  ): kiwi.Constraint[] {
    const actualGap = gap ?? this.theme.defaultStyleSet.horizontalGap
    const builder = this.solver.createConstraintsBuilder()

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

    return builder.getRawConstraints()
  }

  private createArrangeVerticalConstraints(
    targets: LayoutConstraintTarget[],
    gap?: number
  ): kiwi.Constraint[] {
    const actualGap = gap ?? this.theme.defaultStyleSet.verticalGap
    const builder = this.solver.createConstraintsBuilder()

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

    return builder.getRawConstraints()
  }

  private createAlignCenterXConstraints(targets: LayoutConstraintTarget[]): kiwi.Constraint[] {
    const raws: kiwi.Constraint[] = []
    if (targets.length < 2) return raws
    const builder = this.solver.createConstraintsBuilder()
    const firstBounds = targets[0]!.layout

    for (let i = 1; i < targets.length; i++) {
      const currentBounds = targets[i]!.layout

      builder
        .expr([1, currentBounds.x], [0.5, currentBounds.width])
        .eq([1, firstBounds.x], [0.5, firstBounds.width])
        .strong()
    }

    raws.push(...builder.getRawConstraints())
    return raws
  }

  private createAlignRightConstraints(targets: LayoutConstraintTarget[]): kiwi.Constraint[] {
    const raws: kiwi.Constraint[] = []
    if (targets.length < 2) return raws

    const builder = this.solver.createConstraintsBuilder()
    const firstBounds = targets[0]!.layout

    for (let i = 1; i < targets.length; i++) {
      const currentBounds = targets[i]!.layout

      builder
        .expr([1, currentBounds.x], [1, currentBounds.width])
        .eq([1, firstBounds.x], [1, firstBounds.width])
        .strong()
    }

    raws.push(...builder.getRawConstraints())
    return raws
  }

  private record(raws: kiwi.Constraint[], ownerId?: string) {
    if (raws.length === 0) return
    const constraint: LayoutConstraint = {
      id: ownerId ? this.createSymbolScopedId(ownerId) : this.createId(),
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

export { ConstraintsBuilder } from "./constraints_builder"
