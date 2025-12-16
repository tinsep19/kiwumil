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
  private baseUrl: string
  private registry: Record<string, string> = {}

  constructor(plugin: string, baseUrl: string) {
    this.plugin = plugin
    this.baseUrl = baseUrl // typically import.meta.url or file path
  }

  // Register an icon file path relative to the plugin (e.g. 'icons/icon1.svg')
  register(name: string, relPath: string) {
    this.registry[name] = relPath
  }

  // List registered icon names
  list(): string[] {
    return Object.keys(this.registry)
  }

  // Synchronous load helper (returns optimized meta). Real impl should read & sanitize from disk.
  load_sync(name: string): IconMeta {
    const rel = this.registry[name]
    if (!rel) throw new Error(`${name} is not registered.`)
    const id = `${this.plugin}-${name}`.toLowerCase()
    let filePath = ""
    try {
      if (this.baseUrl) {
        try {
          const resolved = new URL(rel, this.baseUrl)
          if (resolved.protocol === "file:") {
            filePath = decodeURIComponent(resolved.pathname)
          } else {
            // unsupported protocol, fall back to resolving as path
            filePath = path.resolve(process.cwd(), rel)
          }
        } catch {
          // baseUrl may be a plain path
          filePath = path.resolve(this.baseUrl, rel)
        }
      } else {
        filePath = path.resolve(process.cwd(), rel)
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
        throw new Error(`Icon file not found: ${rel} resolved to ${filePath}`)
      }
      // If it's an Error, use its message
      if (e instanceof Error) {
        throw new Error(`Failed to load icon ${rel}: ${e.message}`)
      }
      // Fallback for other unknown throwables
      throw new Error(`Failed to load icon ${rel}: ${String(e)}`)
    }
  }
}
