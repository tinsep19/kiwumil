import { IconLoader, type IconMeta } from "./icon_loader"
import { IconRegistry } from "./icon_registry"

/**
 * LoaderFactory - Creates and caches IconLoader instances
 *
 * Provides efficient icon loading with caching to avoid re-reading files.
 * Automatically registers loaded icons to IconRegistry for SVG symbol generation.
 */
export class LoaderFactory {
  private plugin: string
  private baseUrl: string
  private cache: Map<string, IconLoader> = new Map()
  private metaCache: Map<string, IconMeta> = new Map()
  private iconRegistry: IconRegistry

  constructor(plugin: string, baseUrl: string, iconRegistry: IconRegistry) {
    this.plugin = plugin
    this.baseUrl = baseUrl
    this.iconRegistry = iconRegistry
  }

  /**
   * Get or create a cached loader for the given file path
   * If the loader has already been created and loaded, returns the cached result.
   * Otherwise, creates a new IconLoader and loads the icon.
   *
   * @param relPath - Relative path to the icon file
   * @returns Function that returns IconMeta from the loaded icon
   * @throws {Error} if the icon file cannot be loaded or parsed
   */
  cacheLoader(relPath: string): () => IconMeta {
    return () => {
      // Check if we already have cached metadata
      if (this.metaCache.has(relPath)) {
        return this.metaCache.get(relPath)!
      }

      // Check if we have a cached loader
      let loader = this.cache.get(relPath)

      if (!loader) {
        // Create new loader
        const iconName = this.extractIconName(relPath)
        loader = new IconLoader(this.plugin, iconName, this.baseUrl, relPath)
        this.cache.set(relPath, loader)
      }

      // Load and cache the metadata (throws on error)
      const meta = loader.load_sync()
      this.metaCache.set(relPath, meta)

      // Register to IconRegistry for SVG symbol generation
      if (meta.raw) {
        const iconName = this.extractIconName(relPath)
        this.iconRegistry.register(this.plugin, iconName, meta.raw)
      }

      return meta
    }
  }

  /**
   * Extract icon name from file path
   * e.g., "icons/actor.svg" -> "actor"
   */
  private extractIconName(relPath: string): string {
    const parts = relPath.split("/")
    const filename = parts[parts.length - 1]
    if (!filename) {
      return relPath // Fallback to the full path if no filename
    }
    return filename.replace(/\.[^/.]+$/, "") // Remove extension
  }
}
