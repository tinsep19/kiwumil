// src/hint/fluent_enclose_builder.ts
import type { HintTarget, ISymbolCharacs } from "../core"
import type { LayoutContext } from "../model"

/**
 * FluentEncloseBuilder provides a fluent API for creating enclosure relationships.
 * 
 * This builder allows chaining methods to specify:
 * - Children to enclose
 * - Overlay elements (optional)
 * - Container to use
 * 
 * @example
 * ```typescript
 * // With explicit container
 * hint.enclose(child1, child2).in(container);
 * 
 * // With overlay elements
 * hint.enclose(child1, child2).through(overlay1).in(container);
 * 
 * // Using diagram container (shortcut)
 * hint.enclose(child1, child2).layout();
 * ```
 */
export class FluentEncloseBuilder {
  private overlayIds: ISymbolCharacs[] = []

  constructor(
    private readonly context: LayoutContext,
    private readonly resolveTargets: (targets: ISymbolCharacs[]) => HintTarget[],
    private readonly childIds: ISymbolCharacs[],
    private readonly diagramContainer: ISymbolCharacs
  ) {}

  /**
   * Specifies overlay elements that should be rendered on top of the enclosed children.
   * 
   * Overlay elements are also enclosed within the container but may have different
   * visual treatment or z-ordering.
   * 
   * @param overlayIds - IDs of symbols to use as overlays
   * @returns This builder for method chaining
   * 
   * @example
   * ```typescript
   * hint.enclose(child1, child2).through(border, label).in(container);
   * ```
   */
  through(...overlayIds: ISymbolCharacs[]): this {
    this.overlayIds = overlayIds
    return this
  }

  /**
   * Specifies the container to use for enclosing the children.
   * 
   * This finalizes the enclosure relationship by applying constraints
   * to ensure the container bounds contain all children and overlays.
   * 
   * @param containerId - ID of the container symbol
   * 
   * @example
   * ```typescript
   * hint.enclose(child1, child2).in(systemBoundary);
   * ```
   */
  in(containerId: ISymbolCharacs): void {
    this.applyEnclose(containerId)
  }

  /**
   * Applies the enclosure using the diagram's root container.
   * 
   * This is a shortcut for `.in(diagramContainer)` and is useful
   * when you want to enclose elements at the diagram level.
   * 
   * @example
   * ```typescript
   * hint.enclose(child1, child2).layout();
   * ```
   */
  layout(): void {
    this.applyEnclose(this.diagramContainer)
  }

  /**
   * Internal method to apply the enclosure constraints.
   * 
   * @param containerId - ID of the container to use
   */
  private applyEnclose(containerId: ISymbolCharacs): void {
    const containerTargets = this.resolveTargets([containerId])
    if (containerTargets.length === 0) {
      return
    }

    const containerTarget = containerTargets[0]
    if (!containerTarget) {
      return
    }

    // Combine children and overlays
    const allChildIds = [...this.childIds, ...this.overlayIds]
    const childTargets = this.resolveTargets(allChildIds)

    // Apply enclosure constraints
    this.context.hints.enclose(containerTarget, childTargets)

    // TODO: If overlay handling needs different z-ordering or constraints,
    // implement that here. For now, overlays are treated the same as children.
  }
}
