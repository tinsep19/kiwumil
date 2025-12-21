import { IconLoader, type IconMeta } from "./icon_loader"

/**
 * LoaderFactory - Creates and caches IconLoader instances
 * 
 * Provides efficient icon loading with caching to avoid re-reading files
 */
export class LoaderFactory {
  private plugin: string
  private baseUrl: string
  private cache: Map<string, IconLoader> = new Map()
  private metaCache: Map<string, IconMeta> = new Map()

  constructor(plugin: string, baseUrl: string) {
    this.plugin = plugin
    this.baseUrl = baseUrl
  }

  /**
   * Get or create a cached loader for the given file path
   * If the loader has already been created and loaded, returns the cached result.
   * Otherwise, creates a new IconLoader and loads the icon.
   * 
   * @param relPath - Relative path to the icon file
   * @returns IconMeta from the loaded icon, or null if loading fails
   */
  cacheLoader(relPath: string): () => IconMeta | null {
    return () => {
      // Check if we already have cached metadata
      if (this.metaCache.has(relPath)) {
        return this.metaCache.get(relPath)!
      }

      try {
        // Check if we have a cached loader
        let loader = this.cache.get(relPath)
        
        if (!loader) {
          // Create new loader - use relPath as icon name for now
          const iconName = this.extractIconName(relPath)
          loader = new IconLoader(this.plugin, iconName, this.baseUrl, relPath)
          this.cache.set(relPath, loader)
        }

        // Load and cache the metadata
        const meta = loader.load_sync()
        this.metaCache.set(relPath, meta)
        return meta
      } catch {
        return null
      }
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
