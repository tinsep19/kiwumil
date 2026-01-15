/**
 * Service Tokens: DI Container で使用するサービス識別子
 * 
 * 型安全な文字列リテラルとして定義します。
 */
export const SERVICE_TOKENS = {
  // Infrastructure Layer
  CASSOWARY_SOLVER: "ICassowarySolver",

  // Domain Layer - Factories
  VARIABLE_FACTORY: "IVariableFactory",
  CONSTRAINT_FACTORY: "IConstraintFactory",

  // Domain Layer - Services
  SOLVER_ENGINE: "ISolverEngine",

  // Application Layer (Phase 6 で追加予定)
  // LAYOUT_CONTEXT: "ILayoutContext",

  // Presentation Layer (Phase 7 で追加予定)
  // THEME: "ITheme",
} as const

/**
 * ServiceToken: サービストークンの型
 */
export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS]
