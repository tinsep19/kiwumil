// src/domain/ports/icon_provider.ts
// アイコンプロバイダーのインターフェース定義

import type { IconRef } from "../entity/icon/icon_ref"

/**
 * IconProvider: アイコンの参照を返すプロバイダー
 * 個別のアイコンプロパティ（icons.actor など）にクロージャで閉じ込める
 */
export type IconProvider = () => IconRef
