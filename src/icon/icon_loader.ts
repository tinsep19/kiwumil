import * as fs from "fs"
import * as path from "path"

export type IconMeta = {
  width?: number
  height?: number
  viewBox?: string
  href?: string // symbol id reference
  raw?: string // raw svg content (optimized)
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
      const vbMatch = content.match(/<svg[^>]*viewBox=["']([^"']+)["'][^>]*>/i)
      const viewBox = vbMatch ? vbMatch[1] : undefined
      return { href: id, raw: content, viewBox }
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
