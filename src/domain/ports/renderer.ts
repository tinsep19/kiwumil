// src/domain/ports/renderer.ts
// レンダラーのインターフェース定義

/**
 * Renderer: SVG 描画結果を生成するインターフェース
 */
export interface Renderer {
  render(): string
}

/**
 * RenderTarget: 描画結果の出力先を抽象化
 */
export interface RenderTarget {
  output(svg: string): void
}
