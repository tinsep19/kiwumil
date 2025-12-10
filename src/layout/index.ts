export { ConstraintsBuilder } from "./constraints_builder"
export {
  LayoutSolver,
  type ConstraintSpec,
  type LayoutConstraint,
  LayoutVariable,
} from "./layout_solver"
export type { 
  VariableId, 
  BoundId, 
  LayoutConstraintId, 
  ILayoutConstraint, 
  ILayoutVariable, 
  SuggestHandle, 
  SuggestHandleStrength,
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
  HintTarget,
} from "../core"
export { createBoundId, getBoundsValues } from "../core"
export { LayoutVariables } from "./layout_variables"

// For backward compatibility, re-export HintTarget as LayoutConstraintTarget
export type { HintTarget as LayoutConstraintTarget } from "../core"
