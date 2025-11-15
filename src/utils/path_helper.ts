// src/utils/path_helper.ts
import { fileURLToPath } from "node:url"

/**
 * import.meta.url を SVG ファイルパスに変換
 * 
 * @param metaUrl - import.meta.url の値（file:// プロトコルを含むURL）
 * @returns SVG ファイルパス（.ts を .svg に置換）
 * 
 * @example
 * ```typescript
 * convertMetaUrlToSvgPath("file:///home/user/repos/kiwumil/example/actor_simple.ts")
 * // => "/home/user/repos/kiwumil/example/actor_simple.svg"
 * ```
 */
export function convertMetaUrlToSvgPath(metaUrl: string): string {
  const filepath = fileURLToPath(metaUrl)
  return filepath.replace(/\.ts$/, ".svg")
}
