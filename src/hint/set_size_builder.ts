// src/hint/set_size_builder.ts
// SetSize 操作のビルダー

import type { IConstraintsBuilder, LayoutVariable, LayoutBounds } from "../core"
import type { StrengthBuilder } from "./strength_builder"

/**
 * SetSize 操作のビルダー
 */
export class SetSizeBuilder implements StrengthBuilder {
  constructor(
    private readonly builder: IConstraintsBuilder,
    private readonly bounds: LayoutBounds,
    private readonly width: number | LayoutVariable,
    private readonly height: number | LayoutVariable
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
    this.builder
      .expr([1, this.bounds.width])
      .eq([1, this.width])
      [strength]()

    this.builder
      .expr([1, this.bounds.height])
      .eq([1, this.height])
      [strength]()
  }
}
