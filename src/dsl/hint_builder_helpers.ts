// src/dsl/hint_builder_helpers.ts
import type { HintTarget, ConstraintSpec } from "../core"

/**
 * Helper functions for creating layout hint constraint specifications.
 * These functions return ConstraintSpec callbacks that can be used with UserHintRegistrationBuilder.setConstraint().
 */

/**
 * Create horizontal arrangement constraint specification
 * 
 * @param targets Array of targets to arrange horizontally
 * @param gap Spacing between targets
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createArrangeHorizontalSpec(
  targets: HintTarget[],
  gap: number
): ConstraintSpec {
  return (builder) => {
    for (let i = 0; i < targets.length - 1; i++) {
      const current = targets[i]!
      const next = targets[i + 1]!
      const aBounds = current.bounds
      const bBounds = next.bounds

      builder.ct([1, bBounds.x]).eq([1, aBounds.x], [1, aBounds.width], [gap, 1]).strong()
    }
  }
}

/**
 * Create vertical arrangement constraint specification
 * 
 * @param targets Array of targets to arrange vertically
 * @param gap Spacing between targets
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createArrangeVerticalSpec(
  targets: HintTarget[],
  gap: number
): ConstraintSpec {
  return (builder) => {
    for (let i = 0; i < targets.length - 1; i++) {
      const current = targets[i]!
      const next = targets[i + 1]!
      const aBounds = current.bounds
      const bBounds = next.bounds

      builder.ct([1, bBounds.y]).eq([1, aBounds.y], [1, aBounds.height], [gap, 1]).strong()
    }
  }
}

/**
 * Create left alignment constraint specification
 * 
 * @param targets Array of targets to align left (first target is the reference)
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createAlignLeftSpec(
  targets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    if (targets.length === 0) return
    const refBounds = targets[0]!.bounds

    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      builder.ct([1, bounds.x]).eq([1, refBounds.x]).strong()
    }
  }
}

/**
 * Create right alignment constraint specification
 * 
 * @param targets Array of targets to align right (first target is the reference)
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createAlignRightSpec(
  targets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    if (targets.length === 0) return
    const refBounds = targets[0]!.bounds

    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      builder.ct([1, bounds.x], [1, bounds.width])
        .eq([1, refBounds.x], [1, refBounds.width])
        .strong()
    }
  }
}

/**
 * Create top alignment constraint specification
 * 
 * @param targets Array of targets to align top (first target is the reference)
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createAlignTopSpec(
  targets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    if (targets.length === 0) return
    const refBounds = targets[0]!.bounds

    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      builder.ct([1, bounds.y]).eq([1, refBounds.y]).strong()
    }
  }
}

/**
 * Create bottom alignment constraint specification
 * 
 * @param targets Array of targets to align bottom (first target is the reference)
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createAlignBottomSpec(
  targets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    if (targets.length === 0) return
    const refBounds = targets[0]!.bounds

    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      builder.ct([1, bounds.y], [1, bounds.height])
        .eq([1, refBounds.y], [1, refBounds.height])
        .strong()
    }
  }
}

/**
 * Create horizontal center alignment constraint specification
 * 
 * @param targets Array of targets to align center horizontally (first target is the reference)
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createAlignCenterXSpec(
  targets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    if (targets.length === 0) return
    const refBounds = targets[0]!.bounds

    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      builder.ct([1, bounds.x], [0.5, bounds.width])
        .eq([1, refBounds.x], [0.5, refBounds.width])
        .strong()
    }
  }
}

/**
 * Create vertical center alignment constraint specification
 * 
 * @param targets Array of targets to align center vertically (first target is the reference)
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createAlignCenterYSpec(
  targets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    if (targets.length === 0) return
    const refBounds = targets[0]!.bounds

    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      builder.ct([1, bounds.y], [0.5, bounds.height])
        .eq([1, refBounds.y], [0.5, refBounds.height])
        .strong()
    }
  }
}

/**
 * Create width alignment constraint specification
 * 
 * @param targets Array of targets to align width (first target is the reference)
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createAlignWidthSpec(
  targets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    if (targets.length === 0) return
    const refBounds = targets[0]!.bounds

    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      builder.ct([1, bounds.width]).eq([1, refBounds.width]).strong()
    }
  }
}

/**
 * Create height alignment constraint specification
 * 
 * @param targets Array of targets to align height (first target is the reference)
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createAlignHeightSpec(
  targets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    if (targets.length === 0) return
    const refBounds = targets[0]!.bounds

    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      builder.ct([1, bounds.height]).eq([1, refBounds.height]).strong()
    }
  }
}

/**
 * Create enclosure constraint specification (container encompasses children)
 * 
 * Note: This function uses container.container if available (for ContainerBounds),
 * otherwise falls back to container.bounds (for regular LayoutBounds). This allows
 * the function to work with both container symbols and regular symbols used as containers.
 * 
 * @param container Container target (may have container property or just bounds)
 * @param childTargets Array of child targets to enclose
 * @returns ConstraintSpec function for use with setConstraint
 */
export function createEncloseSpec(
  container: HintTarget,
  childTargets: HintTarget[]
): ConstraintSpec {
  return (builder) => {
    // Use container.container if available (ContainerBounds), otherwise use bounds
    const containerBounds = container.container ?? container.bounds

    for (const child of childTargets) {
      const childBounds = child.bounds

      builder.ct([1, childBounds.x]).ge([1, containerBounds.x]).required()
      builder.ct([1, childBounds.y]).ge([1, containerBounds.y]).required()
      builder.ct([1, containerBounds.x], [1, containerBounds.width])
        .ge([1, childBounds.x], [1, childBounds.width])
        .required()
      builder.ct([1, containerBounds.y], [1, containerBounds.height])
        .ge([1, childBounds.y], [1, childBounds.height])
        .required()

      // Z-index depth constraint: child.z >= container.z + 1
      builder.ct([1, childBounds.z]).ge([1, containerBounds.z], [1, 1]).strong()
    }
  }
}
