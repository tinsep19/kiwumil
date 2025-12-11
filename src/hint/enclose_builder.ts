// src/hint/enclose_builder.ts
// Enclose 操作のビルダー

import type { IConstraintsBuilder, ILayoutVariable, LayoutBounds } from "../core"
import type { StrengthBuilder } from "./strength_builder"

/**
 * Enclose の padding 設定ビルダー
 */
export class EnclosePaddingBuilder implements StrengthBuilder {
  constructor(
    private readonly builder: IConstraintsBuilder,
    private readonly container: LayoutBounds,
    private readonly children: LayoutBounds[],
    private readonly paddingValue: number | ILayoutVariable
  ) {}

  weak(): void {
    this.applyConstraints('weak')
  }

  medium(): void {
    this.applyConstraints('medium')
  }

  strong(): void {
    this.applyConstraints('strong')
  }

  required(): void {
    this.applyConstraints('required')
  }

  private applyConstraints(strength: 'weak' | 'medium' | 'strong' | 'required'): void {
    for (const child of this.children) {
      // container.width >= child.width + 2*padding
      this.builder
        .expr([1, this.container.width])
        .ge([1, child.width], [2, this.paddingValue])
        [strength]()

      // container.height >= child.height + 2*padding
      this.builder
        .expr([1, this.container.height])
        .ge([1, child.height], [2, this.paddingValue])
        [strength]()

      // child.x >= container.x + padding
      this.builder
        .expr([1, child.x])
        .ge([1, this.container.x], [1, this.paddingValue])
        [strength]()

      // child.y >= container.y + padding
      this.builder
        .expr([1, child.y])
        .ge([1, this.container.y], [1, this.paddingValue])
        [strength]()
    }
  }
}

/**
 * Enclose の childs 設定ビルダー
 */
export class EncloseChildsBuilder {
  constructor(
    private readonly builder: IConstraintsBuilder,
    private readonly container: LayoutBounds,
    private readonly children: LayoutBounds[]
  ) {}

  padding(value: number | ILayoutVariable): EnclosePaddingBuilder {
    return new EnclosePaddingBuilder(this.builder, this.container, this.children, value)
  }
}

/**
 * Enclose 操作のビルダー
 */
export class EncloseBuilder {
  constructor(
    private readonly builder: IConstraintsBuilder,
    private readonly container: LayoutBounds
  ) {}

  childs(...children: LayoutBounds[]): EncloseChildsBuilder {
    return new EncloseChildsBuilder(this.builder, this.container, children)
  }
}
