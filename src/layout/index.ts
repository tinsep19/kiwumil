export { ConstraintsBuilder } from "./constraints_builder"
export {
  LayoutSolver,
  type LayoutConstraint,
  LayoutVariable,
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
export { LayoutVariables } from "../model"

// For backward compatibility, re-export HintTarget as LayoutConstraintTarget
export type { HintTarget as LayoutConstraintTarget } from "../core"
