// src/hint/fluent_arrange_builder.ts
import type { ISymbolCharacs } from "../core"
import type { LayoutContext } from "../model"
import type { HintTarget } from "../core"

/**
 * FluentArrangeBuilder provides a fluent API for arranging symbols.
 * 
 * This builder allows chaining methods to specify:
 * - Symbols to arrange (passed as arguments)
 * - Optional margin/gap via `.margin(value)`
 * - Direction via `.vertical()` or `.horizontal()`
 * 
 * @example
 * ```typescript
 * // Basic vertical arrangement
 * hint.arrange(sym1, sym2, sym3).vertical();
 * 
 * // With custom margin
 * hint.arrange(sym1, sym2, sym3).margin(20).vertical();
 * 
 * // Horizontal arrangement
 * hint.arrange(sym1, sym2, sym3).horizontal();
 * ```
 */
export class FluentArrangeBuilder {
  private gapValue?: number

  constructor(
    private readonly context: LayoutContext,
    private readonly resolveTargets: (targets: ISymbolCharacs[]) => HintTarget[],
    private readonly symbolIds: ISymbolCharacs[]
  ) {}

  /**
   * Specifies the margin/gap between arranged symbols.
   * 
   * If not specified, the theme's default gap will be used.
   * 
   * @param value - Gap size as a number
   * @returns This builder for method chaining
   * 
   * @example
   * ```typescript
   * hint.arrange(sym1, sym2, sym3).margin(30).vertical();
   * ```
   */
  margin(value: number): this {
    this.gapValue = value
    return this
  }

  /**
   * Arranges symbols vertically from top to bottom.
   * 
   * This finalizes the arrangement by applying vertical constraints
   * with the specified or default gap.
   * 
   * @example
   * ```typescript
   * hint.arrange(sym1, sym2, sym3).vertical();
   * // Results in: [sym1]
   * //             gap
   * //             [sym2]
   * //             gap
   * //             [sym3]
   * ```
   */
  vertical(): void {
    const targets = this.resolveTargets(this.symbolIds)
    if (this.gapValue !== undefined) {
      this.context.hints.arrangeVertical(targets, this.gapValue)
    } else {
      this.context.hints.arrangeVertical(targets)
    }
  }

  /**
   * Arranges symbols horizontally from left to right.
   * 
   * This finalizes the arrangement by applying horizontal constraints
   * with the specified or default gap.
   * 
   * @example
   * ```typescript
   * hint.arrange(sym1, sym2, sym3).horizontal();
   * // Results in: [sym1] -- gap -- [sym2] -- gap -- [sym3]
   * ```
   */
  horizontal(): void {
    const targets = this.resolveTargets(this.symbolIds)
    if (this.gapValue !== undefined) {
      this.context.hints.arrangeHorizontal(targets, this.gapValue)
    } else {
      this.context.hints.arrangeHorizontal(targets)
    }
  }
}
