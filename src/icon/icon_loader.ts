import * as fs from "fs"
import * as path from "path"

export type IconMeta = {
  width: number
  height: number
  viewBox: string
  href: string // symbol id reference
  raw: string // raw svg content (optimized)
}

/**
 * Parse SVG content and extract all required IconMeta properties.
 * 
 * @param content - Raw SVG content as a string
 * @param id - Symbol ID for the icon (used as href)
 * @returns IconMeta with all required properties
 * @throws {Error} if any required property cannot be extracted
 */
export function parse(content: string, id: string): IconMeta {
  // Extract viewBox
  const viewBoxMatch = content.match(/<svg[^>]*viewBox=["']([^"']+)["'][^>]*>/i)
  if (!viewBoxMatch || !viewBoxMatch[1]) {
    throw new Error(`Failed to extract viewBox from SVG content`)
  }
  const viewBox = viewBoxMatch[1]

  // Extract width - try width attribute first, then fall back to viewBox
  let width: number | undefined
  const widthMatch = content.match(/<svg[^>]*width=["'](\d+(?:\.\d+)?)["'][^>]*>/i)
  if (widthMatch && widthMatch[1]) {
    width = parseFloat(widthMatch[1])
  } else {
    // Try to extract from viewBox (format: "minX minY width height")
    const viewBoxParts = viewBox.split(/\s+/)
    if (viewBoxParts.length === 4 && viewBoxParts[2]) {
      width = parseFloat(viewBoxParts[2])
    }
  }
  
  if (width === undefined || isNaN(width)) {
    throw new Error(`Failed to extract width from SVG content`)
  }

  // Extract height - try height attribute first, then fall back to viewBox
  let height: number | undefined
  const heightMatch = content.match(/<svg[^>]*height=["'](\d+(?:\.\d+)?)["'][^>]*>/i)
  if (heightMatch && heightMatch[1]) {
    height = parseFloat(heightMatch[1])
  } else {
    // Try to extract from viewBox (format: "minX minY width height")
    const viewBoxParts = viewBox.split(/\s+/)
    if (viewBoxParts.length === 4 && viewBoxParts[3]) {
      height = parseFloat(viewBoxParts[3])
    }
  }
  
  if (height === undefined || isNaN(height)) {
    throw new Error(`Failed to extract height from SVG content`)
  }

  return {
    width,
    height,
    viewBox,
    href: id,
    raw: content
  }
}

export class IconLoader {
  private plugin: string
  private name: string
  private baseUrl: string
  private relPath: string

  constructor(plugin: string, name: string, baseUrl: string, relPath: string) {
    this.plugin = plugin
    this.name = name
    this.baseUrl = baseUrl // typically import.meta.url or file path
    this.relPath = relPath
  }

  // Synchronous load helper (returns optimized meta). Real impl should read & sanitize from disk.
  load_sync(): IconMeta {
    const id = `${this.plugin}-${this.name}`.toLowerCase()
    let filePath = ""
    try {
      if (this.baseUrl) {
        try {
          const resolved = new URL(this.relPath, this.baseUrl)
          if (resolved.protocol === "file:") {
            filePath = decodeURIComponent(resolved.pathname)
          } else {
            // unsupported protocol, fall back to resolving as path
            filePath = path.resolve(process.cwd(), this.relPath)
          }
        } catch {
          // baseUrl may be a plain path
          filePath = path.resolve(this.baseUrl, this.relPath)
        }
      } else {
        filePath = path.resolve(process.cwd(), this.relPath)
      }

      const content = fs.readFileSync(filePath, "utf8")
      return parse(content, id)
    } catch (e: unknown) {
      // If file not found (Node's ErrnoException), check for code property safely
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: unknown }).code === "ENOENT"
      ) {
        throw new Error(
          `Icon file not found: ${this.relPath} resolved to ${filePath}`
        )
      }
      // If it's an Error, use its message
      if (e instanceof Error) {
        throw new Error(`Failed to load icon ${this.relPath}: ${e.message}`)
      }
      // Fallback for other unknown throwables
      throw new Error(`Failed to load icon ${this.relPath}: ${String(e)}`)
    }
  }
}
