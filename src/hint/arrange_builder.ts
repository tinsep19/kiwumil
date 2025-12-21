// src/hint/arrange_builder.ts
// Arrange 操作のビルダー

import type { LinearConstraintBuilder, Variable, LayoutBounds, ItemBounds } from "../core"
import type { StrengthBuilder } from "./strength_builder"

/**
 * Arrange の方向設定ビルダー
 */
export class ArrangeDirectionBuilder implements StrengthBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly elements: (LayoutBounds | ItemBounds)[],
    private readonly marginValue: number | Variable,
    private readonly direction: "horizontal" | "vertical"
  ) {}

  weak(): void {
    this.applyConstraints("weak")
  }

  medium(): void {
    this.applyConstraints("medium")
  }

  strong(): void {
    this.applyConstraints("strong")
  }

  required(): void {
    this.applyConstraints("required")
  }

  private applyConstraints(strength: "weak" | "medium" | "strong" | "required"): void {
    for (let i = 0; i < this.elements.length - 1; i++) {
      const prev = this.elements[i]
      const next = this.elements[i + 1]
      if (!prev || !next) continue

      if (this.direction === "horizontal") {
        // next.x >= prev.x + prev.width + margin
        // Equivalently: prev.right + margin = next.left
        this.builder
          .ct([1, next.x])
          .ge([1, prev.x], [1, prev.width], [1, this.marginValue])
          [strength]()
      } else {
        // next.y >= prev.y + prev.height + margin
        // Equivalently: prev.bottom + margin = next.top
        this.builder
          .ct([1, next.y])
          .ge([1, prev.y], [1, prev.height], [1, this.marginValue])
          [strength]()
      }
    }
  }
}

/**
 * Arrange の margin 設定ビルダー
 */
export class ArrangeMarginBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly elements: (LayoutBounds | ItemBounds)[],
    private readonly marginValue: number | Variable
  ) {}

  horizontal(): ArrangeDirectionBuilder {
    return new ArrangeDirectionBuilder(this.builder, this.elements, this.marginValue, "horizontal")
  }

  vertical(): ArrangeDirectionBuilder {
    return new ArrangeDirectionBuilder(this.builder, this.elements, this.marginValue, "vertical")
  }
}

/**
 * Arrange 操作のビルダー
 */
export class ArrangeBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly elements: (LayoutBounds | ItemBounds)[]
  ) {}

  margin(value: number | Variable): ArrangeMarginBuilder {
    return new ArrangeMarginBuilder(this.builder, this.elements, value)
  }
}
