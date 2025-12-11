// src/hint/strength_builder.ts
// 制約の強度を設定するためのビルダーインターフェース

/**
 * 制約の強度を設定するためのビルダーインターフェース
 */
export interface StrengthBuilder {
  weak(): void
  medium(): void
  strong(): void
  required(): void
}
