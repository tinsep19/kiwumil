// src/plugin/core/symbols/text_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../model/types"
import type { LayoutVariables } from "../../../layout/layout_variables"

const DEFAULT_PADDING_X = 12
const DEFAULT_PADDING_Y = 8
const LINE_HEIGHT_FACTOR = 1.2
const DEFAULT_TEXT_ANCHOR = "middle"

export type TextAnchor = "start" | "middle" | "end"

export interface TextInfo {
  label: string
  textAnchor?: TextAnchor
  fontSize?: number
  fontFamily?: string
  textColor?: string
  lineHeightFactor?: number
}

type TextOverrides = Omit<TextInfo, "label">

function fallbackStyle() {
  return {
    strokeColor: "transparent",
    strokeWidth: 0,
    fillColor: "transparent",
    textColor: "black",
    fontSize: 14,
    fontFamily: "Arial",
    backgroundColor: "transparent",
    horizontalGap: 80,
    verticalGap: 50,
  }
}

export class TextSymbol extends SymbolBase {
  private overrides: TextOverrides

  constructor(id: string, info: string | TextInfo, layoutContext?: LayoutVariables) {
    if (typeof info === "string") {
      super(id, info, layoutContext)
      this.overrides = {}
      return
    }

    const { label, ...overrides } = info
    super(id, label, layoutContext)
    this.overrides = overrides
  }

  private getLines(): string[] {
    const normalized = this.label.replace(/\r\n/g, "\n")
    const lines = normalized.split("\n")
    return lines.length > 0 ? lines : [""]
  }

  private getStyle() {
    const base = this.theme ? getStyleForSymbol(this.theme, "text") : fallbackStyle()
    return {
      ...base,
      fontSize: this.overrides.fontSize ?? base.fontSize,
      fontFamily: this.overrides.fontFamily ?? base.fontFamily,
      textColor: this.overrides.textColor ?? base.textColor,
    }
  }

  private getLineHeightFactor() {
    return this.overrides.lineHeightFactor ?? LINE_HEIGHT_FACTOR
  }

  private getAnchor(): TextAnchor {
    return this.overrides.textAnchor ?? DEFAULT_TEXT_ANCHOR
  }

  getDefaultSize() {
    const style = this.getStyle()
    const lineHeightFactor = this.getLineHeightFactor()
    const lines = this.getLines()
    const longest = Math.max(...lines.map((line) => line.length), 1)
    const approxCharWidth = style.fontSize * 0.6
    const textWidth = longest * approxCharWidth
    const lineHeight = style.fontSize * lineHeightFactor
    const textHeight = lines.length * lineHeight

    return {
      width: textWidth + DEFAULT_PADDING_X * 2,
      height: textHeight + DEFAULT_PADDING_Y * 2,
    }
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = this.getBoundsValues()

    const cx = x + width / 2
    const cy = y + height / 2
    const dx = from.x - cx
    const dy = from.y - cy
    const halfWidth = width / 2
    const halfHeight = height / 2

    if (dx === 0 && dy === 0) {
      return { x: cx + halfWidth, y: cy }
    }

    const tx = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity
    const ty = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity
    const t = Math.min(tx, ty)

    return {
      x: cx + dx * t,
      y: cy + dy * t,
    }
  }

  toSVG(): string {
    const { x, y, width } = this.getBoundsValues()

    const style = this.getStyle()
    const lines = this.getLines()
    const anchor = this.getAnchor()
    const lineHeightFactor = this.getLineHeightFactor()
    const baseX = anchor === "start"
      ? x + DEFAULT_PADDING_X
      : anchor === "end"
        ? x + width - DEFAULT_PADDING_X
        : x + width / 2

    const startY = y + DEFAULT_PADDING_Y + style.fontSize
    const lineHeight = style.fontSize * lineHeightFactor

    const tspans = lines
      .map((line, index) => {
        const dy = index === 0 ? 0 : lineHeight
        const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        return `<tspan x="${baseX}" dy="${dy}">${escaped || " "}</tspan>`
      })
      .join("\n")

    return `
      <g id="${this.id}">
        <text x="${baseX}" y="${startY}"
              text-anchor="${anchor}"
              font-size="${style.fontSize}"
              font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${tspans}
        </text>
      </g>
    `
  }
}
