// src/dsl/hint_builder_helpers.ts
import type { UserHintRegistrationBuilder } from "../model"
import type { HintTarget, LayoutConstraint, Variable } from "../core"
import type { Theme } from "../theme"

/**
 * Helper functions for creating layout hint constraints using UserHintRegistrationBuilder.
 * These functions provide factory methods for common layout patterns like alignment and arrangement.
 */

/**
 * Create horizontal arrangement constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to arrange horizontally
 * @param gap Spacing between targets
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint
 */
export function createArrangeHorizontalConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  gap: number,
  constraintId: string
): LayoutConstraint {
  return builder.createConstraint(constraintId, (cb) => {
    for (let i = 0; i < targets.length - 1; i++) {
      const current = targets[i]!
      const next = targets[i + 1]!
      const aBounds = current.bounds
      const bBounds = next.bounds

      cb.ct([1, bBounds.x]).eq([1, aBounds.x], [1, aBounds.width], [gap, 1]).strong()
    }
  })
}

/**
 * Create vertical arrangement constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to arrange vertically
 * @param gap Spacing between targets
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint
 */
export function createArrangeVerticalConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  gap: number,
  constraintId: string
): LayoutConstraint {
  return builder.createConstraint(constraintId, (cb) => {
    for (let i = 0; i < targets.length - 1; i++) {
      const current = targets[i]!
      const next = targets[i + 1]!
      const aBounds = current.bounds
      const bBounds = next.bounds

      cb.ct([1, bBounds.y]).eq([1, aBounds.y], [1, aBounds.height], [gap, 1]).strong()
    }
  })
}

/**
 * Create left alignment constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to align left
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint or null if no targets
 */
export function createAlignLeftConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  constraintId: string
): LayoutConstraint | null {
  if (targets.length === 0) return null
  const refBounds = targets[0]!.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      cb.ct([1, bounds.x]).eq([1, refBounds.x]).strong()
    }
  })
}

/**
 * Create right alignment constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to align right
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint or null if no targets
 */
export function createAlignRightConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  constraintId: string
): LayoutConstraint | null {
  if (targets.length === 0) return null
  const refBounds = targets[0]!.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      cb.ct([1, bounds.x], [1, bounds.width])
        .eq([1, refBounds.x], [1, refBounds.width])
        .strong()
    }
  })
}

/**
 * Create top alignment constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to align top
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint or null if no targets
 */
export function createAlignTopConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  constraintId: string
): LayoutConstraint | null {
  if (targets.length === 0) return null
  const refBounds = targets[0]!.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      cb.ct([1, bounds.y]).eq([1, refBounds.y]).strong()
    }
  })
}

/**
 * Create bottom alignment constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to align bottom
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint or null if no targets
 */
export function createAlignBottomConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  constraintId: string
): LayoutConstraint | null {
  if (targets.length === 0) return null
  const refBounds = targets[0]!.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      cb.ct([1, bounds.y], [1, bounds.height])
        .eq([1, refBounds.y], [1, refBounds.height])
        .strong()
    }
  })
}

/**
 * Create horizontal center alignment constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to align center horizontally
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint or null if no targets
 */
export function createAlignCenterXConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  constraintId: string
): LayoutConstraint | null {
  if (targets.length === 0) return null
  const refBounds = targets[0]!.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      cb.ct([1, bounds.x], [0.5, bounds.width])
        .eq([1, refBounds.x], [0.5, refBounds.width])
        .strong()
    }
  })
}

/**
 * Create vertical center alignment constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to align center vertically
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint or null if no targets
 */
export function createAlignCenterYConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  constraintId: string
): LayoutConstraint | null {
  if (targets.length === 0) return null
  const refBounds = targets[0]!.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      cb.ct([1, bounds.y], [0.5, bounds.height])
        .eq([1, refBounds.y], [0.5, refBounds.height])
        .strong()
    }
  })
}

/**
 * Create width alignment constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to align width
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint or null if no targets
 */
export function createAlignWidthConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  constraintId: string
): LayoutConstraint | null {
  if (targets.length === 0) return null
  const refBounds = targets[0]!.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      cb.ct([1, bounds.width]).eq([1, refBounds.width]).strong()
    }
  })
}

/**
 * Create height alignment constraints for targets
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param targets Array of targets to align height
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint or null if no targets
 */
export function createAlignHeightConstraint(
  builder: UserHintRegistrationBuilder,
  targets: HintTarget[],
  constraintId: string
): LayoutConstraint | null {
  if (targets.length === 0) return null
  const refBounds = targets[0]!.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const target of targets.slice(1)) {
      const bounds = target.bounds
      cb.ct([1, bounds.height]).eq([1, refBounds.height]).strong()
    }
  })
}

/**
 * Create enclosure constraints (container encompasses children)
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param container Container target
 * @param childTargets Array of child targets to enclose
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint
 */
export function createEncloseConstraint(
  builder: UserHintRegistrationBuilder,
  container: HintTarget,
  childTargets: HintTarget[],
  constraintId: string
): LayoutConstraint {
  const containerBounds = container.container ?? container.bounds

  return builder.createConstraint(constraintId, (cb) => {
    for (const child of childTargets) {
      const childBounds = child.bounds

      cb.ct([1, childBounds.x]).ge([1, containerBounds.x]).required()
      cb.ct([1, childBounds.y]).ge([1, containerBounds.y]).required()
      cb.ct([1, containerBounds.x], [1, containerBounds.width])
        .ge([1, childBounds.x], [1, childBounds.width])
        .required()
      cb.ct([1, containerBounds.y], [1, containerBounds.height])
        .ge([1, childBounds.y], [1, childBounds.height])
        .required()

      // Z-index depth constraint: child.z >= container.z + 1
      cb.ct([1, childBounds.z]).ge([1, containerBounds.z], [1, 1]).strong()
    }
  })
}

/**
 * Create a guide variable constraint that sets the variable to a specific value
 * 
 * @param builder UserHintRegistrationBuilder to use for creating constraints
 * @param variable The guide variable to constrain
 * @param value The target value
 * @param constraintId Unique identifier for the constraint
 * @returns Created LayoutConstraint
 */
export function createGuideValueConstraint(
  builder: UserHintRegistrationBuilder,
  variable: Variable,
  value: number,
  constraintId: string
): LayoutConstraint {
  return builder.createConstraint(constraintId, (cb) => {
    cb.ct([1, variable]).eq([value, 1]).strong()
  })
}
