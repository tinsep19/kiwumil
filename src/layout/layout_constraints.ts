import * as kiwi from "@lume/kiwi"
import type { Theme } from "../core/theme"
import type { SymbolBase, LayoutBounds } from "../model/symbol_base"
import type { SymbolId, ContainerSymbolId } from "../model/types"
import {
  LayoutConstraintOperator,
  LayoutConstraintStrength,
  LayoutVariables,
  type LayoutExpressionInput,
  type LayoutTerm
} from "./layout_variables"

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
  | "symbolBounds"
  | "containerInbounds"

export interface LayoutConstraint {
  id: LayoutConstraintId
  type: LayoutConstraintType
  rawConstraints: kiwi.Constraint[]
}

type LayoutSymbolId = SymbolId | ContainerSymbolId

type ContainerContentBoundsProvider = SymbolBase & {
  getContentLayoutBounds: () => LayoutBounds
}

function hasContentLayoutBounds(symbol: SymbolBase): symbol is ContainerContentBoundsProvider {
  return typeof (symbol as ContainerContentBoundsProvider).getContentLayoutBounds === "function"
}

export class LayoutConstraintBuilder {
  private readonly raws: kiwi.Constraint[] = []

  constructor(private readonly vars: LayoutVariables) {}

  expression(terms?: LayoutTerm[], constant = 0) {
    return this.vars.expression(terms, constant)
  }

  eq(
    left: LayoutExpressionInput,
    right: LayoutExpressionInput,
    strength: LayoutConstraintStrength = LayoutConstraintStrength.Strong
  ) {
    this.raws.push(
      this.vars.addConstraint(left, LayoutConstraintOperator.Eq, right, strength)
    )
    return this
  }

  ge(
    left: LayoutExpressionInput,
    right: LayoutExpressionInput,
    strength: LayoutConstraintStrength = LayoutConstraintStrength.Weak
  ) {
    this.raws.push(
      this.vars.addConstraint(left, LayoutConstraintOperator.Ge, right, strength)
    )
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
    private readonly vars: LayoutVariables,
    private readonly theme: Theme,
    private readonly resolveSymbol: (id: LayoutSymbolId) => SymbolBase | undefined
  ) {}

  list(): LayoutConstraint[] {
    return [...this.constraints]
  }

  withSymbol(
    symbol: SymbolBase | LayoutSymbolId,
    type: LayoutConstraintType,
    build: (builder: LayoutConstraintBuilder) => void
  ) {
    const builder = new LayoutConstraintBuilder(this.vars)
    build(builder)
    const targetId = typeof symbol === "string" ? symbol : symbol.id
    this.record(type, builder.getRawConstraints(), targetId)
  }

  expression(terms?: LayoutTerm[], constant = 0) {
    return this.vars.expression(terms, constant)
  }

  arrangeHorizontal(symbolIds: LayoutSymbolId[], gap = this.theme.defaultStyleSet.horizontalGap) {
    const raws: kiwi.Constraint[] = []

    for (let i = 0; i < symbolIds.length - 1; i++) {
      const a = this.resolveSymbolById(symbolIds[i])
      const b = this.resolveSymbolById(symbolIds[i + 1])
      if (!a || !b) continue
      const aBounds = a.ensureLayoutBounds(this.vars)
      const bBounds = b.ensureLayoutBounds(this.vars)

      raws.push(
        this.vars.addConstraint(
          bBounds.x,
          LayoutConstraintOperator.Eq,
          this.vars.expression(
            [
              { variable: aBounds.x },
              { variable: aBounds.width }
            ],
            gap
          ),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("arrangeHorizontal", raws)
  }

  arrangeVertical(symbolIds: LayoutSymbolId[], gap = this.theme.defaultStyleSet.verticalGap) {
    const raws: kiwi.Constraint[] = []

    for (let i = 0; i < symbolIds.length - 1; i++) {
      const a = this.resolveSymbolById(symbolIds[i])
      const b = this.resolveSymbolById(symbolIds[i + 1])
      if (!a || !b) continue
      const aBounds = a.ensureLayoutBounds(this.vars)
      const bBounds = b.ensureLayoutBounds(this.vars)

      raws.push(
        this.vars.addConstraint(
          bBounds.y,
          LayoutConstraintOperator.Eq,
          this.vars.expression(
            [
              { variable: aBounds.y },
              { variable: aBounds.height }
            ],
            gap
          ),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("arrangeVertical", raws)
  }

  alignLeft(symbolIds: LayoutSymbolId[]) {
    const raws: kiwi.Constraint[] = []
    if (symbolIds.length === 0) return
    const reference = this.resolveSymbolById(symbolIds[0])
    if (!reference) return
    const refBounds = reference.ensureLayoutBounds(this.vars)

    for (const id of symbolIds.slice(1)) {
      const symbol = this.resolveSymbolById(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.vars)
      raws.push(
        this.vars.addConstraint(
          bounds.x,
          LayoutConstraintOperator.Eq,
          refBounds.x,
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignLeft", raws)
  }

  alignRight(symbolIds: LayoutSymbolId[]) {
    const raws: kiwi.Constraint[] = []
    if (symbolIds.length === 0) return
    const reference = this.resolveSymbolById(symbolIds[0])
    if (!reference) return
    const refBounds = reference.ensureLayoutBounds(this.vars)

    for (const id of symbolIds.slice(1)) {
      const symbol = this.resolveSymbolById(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.vars)
      raws.push(
        this.vars.addConstraint(
          this.vars.expression([
            { variable: bounds.x },
            { variable: bounds.width }
          ]),
          LayoutConstraintOperator.Eq,
          this.vars.expression([
            { variable: refBounds.x },
            { variable: refBounds.width }
          ]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignRight", raws)
  }

  alignTop(symbolIds: LayoutSymbolId[]) {
    const raws: kiwi.Constraint[] = []
    if (symbolIds.length === 0) return
    const reference = this.resolveSymbolById(symbolIds[0])
    if (!reference) return
    const refBounds = reference.ensureLayoutBounds(this.vars)

    for (const id of symbolIds.slice(1)) {
      const symbol = this.resolveSymbolById(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.vars)
      raws.push(
        this.vars.addConstraint(
          bounds.y,
          LayoutConstraintOperator.Eq,
          refBounds.y,
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignTop", raws)
  }

  alignBottom(symbolIds: LayoutSymbolId[]) {
    const raws: kiwi.Constraint[] = []
    if (symbolIds.length === 0) return
    const reference = this.resolveSymbolById(symbolIds[0])
    if (!reference) return
    const refBounds = reference.ensureLayoutBounds(this.vars)

    for (const id of symbolIds.slice(1)) {
      const symbol = this.resolveSymbolById(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.vars)
      raws.push(
        this.vars.addConstraint(
          this.vars.expression([
            { variable: bounds.y },
            { variable: bounds.height }
          ]),
          LayoutConstraintOperator.Eq,
          this.vars.expression([
            { variable: refBounds.y },
            { variable: refBounds.height }
          ]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignBottom", raws)
  }

  alignCenterX(symbolIds: LayoutSymbolId[]) {
    const raws: kiwi.Constraint[] = []
    if (symbolIds.length === 0) return
    const reference = this.resolveSymbolById(symbolIds[0])
    if (!reference) return
    const refBounds = reference.ensureLayoutBounds(this.vars)

    for (const id of symbolIds.slice(1)) {
      const symbol = this.resolveSymbolById(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.vars)
      raws.push(
        this.vars.addConstraint(
          this.vars.expression([
            { variable: bounds.x },
            { variable: bounds.width, coefficient: 0.5 }
          ]),
          LayoutConstraintOperator.Eq,
          this.vars.expression([
            { variable: refBounds.x },
            { variable: refBounds.width, coefficient: 0.5 }
          ]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignCenterX", raws)
  }

  alignCenterY(symbolIds: LayoutSymbolId[]) {
    const raws: kiwi.Constraint[] = []
    if (symbolIds.length === 0) return
    const reference = this.resolveSymbolById(symbolIds[0])
    if (!reference) return
    const refBounds = reference.ensureLayoutBounds(this.vars)

    for (const id of symbolIds.slice(1)) {
      const symbol = this.resolveSymbolById(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.vars)
      raws.push(
        this.vars.addConstraint(
          this.vars.expression([
            { variable: bounds.y },
            { variable: bounds.height, coefficient: 0.5 }
          ]),
          LayoutConstraintOperator.Eq,
          this.vars.expression([
            { variable: refBounds.y },
            { variable: refBounds.height, coefficient: 0.5 }
          ]),
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignCenterY", raws)
  }

  alignWidth(symbolIds: LayoutSymbolId[]) {
    const raws: kiwi.Constraint[] = []
    if (symbolIds.length === 0) return
    const reference = this.resolveSymbolById(symbolIds[0])
    if (!reference) return
    const refBounds = reference.ensureLayoutBounds(this.vars)

    for (const id of symbolIds.slice(1)) {
      const symbol = this.resolveSymbolById(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.vars)
      raws.push(
        this.vars.addConstraint(
          bounds.width,
          LayoutConstraintOperator.Eq,
          refBounds.width,
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignWidth", raws)
  }

  alignHeight(symbolIds: LayoutSymbolId[]) {
    const raws: kiwi.Constraint[] = []
    if (symbolIds.length === 0) return
    const reference = this.resolveSymbolById(symbolIds[0])
    if (!reference) return
    const refBounds = reference.ensureLayoutBounds(this.vars)

    for (const id of symbolIds.slice(1)) {
      const symbol = this.resolveSymbolById(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.vars)
      raws.push(
        this.vars.addConstraint(
          bounds.height,
          LayoutConstraintOperator.Eq,
          refBounds.height,
          LayoutConstraintStrength.Strong
        )
      )
    }

    this.record("alignHeight", raws)
  }

  alignSize(symbolIds: LayoutSymbolId[]) {
    this.alignWidth(symbolIds)
    this.alignHeight(symbolIds)
  }

  enclose(containerId: ContainerSymbolId, childIds: LayoutSymbolId[]) {
    const container = this.resolveSymbolById(containerId)
    if (!container) return
    const containerBounds = hasContentLayoutBounds(container)
      ? container.getContentLayoutBounds()
      : container.ensureLayoutBounds(this.vars)
    const raws: kiwi.Constraint[] = []

    for (const childId of childIds) {
      const child = this.resolveSymbolById(childId)
      if (!child) continue
      const childBounds = child.ensureLayoutBounds(this.vars)

      raws.push(
        this.vars.addConstraint(
          childBounds.x,
          LayoutConstraintOperator.Ge,
          containerBounds.x,
          LayoutConstraintStrength.Required
        )
      )

      raws.push(
        this.vars.addConstraint(
          childBounds.y,
          LayoutConstraintOperator.Ge,
          containerBounds.y,
          LayoutConstraintStrength.Required
        )
      )

      raws.push(
        this.vars.addConstraint(
          this.vars.expression([
            { variable: containerBounds.x },
            { variable: containerBounds.width }
          ]),
          LayoutConstraintOperator.Ge,
          this.vars.expression(
            [
              { variable: childBounds.x },
              { variable: childBounds.width }
            ],
          ),
          LayoutConstraintStrength.Required
        )
      )

      raws.push(
        this.vars.addConstraint(
          this.vars.expression([
            { variable: containerBounds.y },
            { variable: containerBounds.height }
          ]),
          LayoutConstraintOperator.Ge,
          this.vars.expression(
            [
              { variable: childBounds.y },
              { variable: childBounds.height }
            ],
          ),
          LayoutConstraintStrength.Required
        )
      )
    }

    this.record("enclose", raws)
  }

  private record(type: LayoutConstraintType, raws: kiwi.Constraint[], targetId?: LayoutSymbolId) {
    if (raws.length === 0) return
    const constraint: LayoutConstraint = {
      id: targetId ? this.createSymbolScopedId(targetId) : this.createId(),
      type,
      rawConstraints: raws
    }
    this.constraints.push(constraint)
  }

  private createId(): LayoutConstraintId {
    return `constraints/${this.counter++}` as LayoutConstraintId
  }

  private createSymbolScopedId(targetId: LayoutSymbolId): LayoutConstraintId {
    const base = String(targetId)
    const next = this.symbolCounter.get(base) ?? 0
    this.symbolCounter.set(base, next + 1)
    return `constraints/${base}/${next}` as LayoutConstraintId
  }

  private resolveSymbolById(id?: LayoutSymbolId) {
    if (!id) return undefined
    return this.resolveSymbol(id)
  }
}
