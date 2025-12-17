export {
  KiwiSolver,
  isKiwiVariable,
  isBrandedKiwi,
  isKiwiLinearConstraints,
} from "./kiwi_solver"
export type { KiwiLinearConstraints } from "./kiwi_solver"
// Note: Variables export removed to avoid circular dependency
// Import directly from "@/model" instead
