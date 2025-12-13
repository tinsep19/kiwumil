// src/hint/align_builder.ts
// Align 操作のビルダー

import type { LinearConstraintBuilder, LayoutVariable } from "../core"
import type { StrengthBuilder } from "./strength_builder"

/**
 * Align 操作のビルダー
 */
export class AlignBuilder implements StrengthBuilder {
  constructor(
    private readonly builder: LinearConstraintBuilder,
    private readonly vars: LayoutVariable[]
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
    if (this.vars.length < 2) {
      return
    }

    for (let i = 0; i < this.vars.length - 1; i++) {
      const current = this.vars[i]
      const next = this.vars[i + 1]
      if (current && next) {
        this.builder
          .expr([1, current])
          .eq([1, next])
          [strength]()
      }
    }
  }
}
