export { ConstraintsBuilder } from "./constraints_builder"
export {
  LayoutSolver,
  type LayoutConstraint,
  LayoutVariable,
  isLayoutVariable,
  isBrandedKiwi,
} from "./layout_solver"
export type { 
  VariableId, 
  BoundId, 
  LayoutConstraintId, 
  ILayoutConstraint, 
  ILayoutVariable, 
  ISuggestHandle, 
  ConstraintStrength,
  ISuggestHandleFactory,
  Bounds,
  BoundsType,
  ContainerBounds,
  ItemBounds,
  LayoutBounds,
  TypedBounds,
  BoundsMap,
  Term,
  IConstraintsBuilder,
  ConstraintSpec,
  HintTarget,
  ILayoutSolver,
} from "../core"
export { createBoundId, getBoundsValues } from "../core"
// Note: LayoutVariables export removed to avoid circular dependency
// Import directly from "@/model" instead

// For backward compatibility, re-export HintTarget as LayoutConstraintTarget
export type { HintTarget as LayoutConstraintTarget } from "../core"
