// src/domain/entity/icon/icon_ref.ts
// アイコンの参照（Domain は参照のみを持つ）

/**
 * IconRef: アイコンの参照
 * domain 層ではアイコンの実体（SVG データ）は持たず、参照のみを保持
 */
export interface IconRef {
  /** アイコンの一意な識別子 */
  readonly id: string
  /** viewBox 属性（例: "0 0 24 24"） */
  readonly viewBox: string
  /** アイコンの幅 */
  readonly width: number
  /** アイコンの高さ */
  readonly height: number
}
