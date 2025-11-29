import { LayoutConstraintStrength } from "./layout_constraints"
import type { ConstraintsBuilder } from "./constraints_builder"

export function finalizeConstraint(
  builder: ConstraintsBuilder,
  strength: LayoutConstraintStrength
) {
  if (strength === LayoutConstraintStrength.Required) {
    return builder.required()
  }
  if (strength === LayoutConstraintStrength.Strong) {
    return builder.strong()
  }
  return builder.weak()
}
