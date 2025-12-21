import { IconLoader } from "./icon_loader"

export class IconSet {
  private plugin: string
  private baseUrl: string
  private registry: Map<string, string> = new Map()

  constructor(plugin: string, baseUrl: string) {
    this.plugin = plugin
    this.baseUrl = baseUrl // typically import.meta.url or file path
  }

  /**
   * Register an icon file path relative to the plugin (e.g. 'icons/icon1.svg')
   * @throws {Error} if the icon name is already registered
   */
  register(name: string, relPath: string): void {
    if (this.registry.has(name)) {
      throw new Error(
        `Icon "${name}" is already registered in plugin "${this.plugin}"`
      )
    }
    this.registry.set(name, relPath)
  }

  /**
   * List all registered icon names
   */
  list(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Create an IconLoader instance for a specific icon
   * @throws {Error} if the icon name is not registered
   */
  createLoader(name: string): IconLoader {
    const relPath = this.registry.get(name)
    if (!relPath) {
      throw new Error(
        `Icon "${name}" is not registered in plugin "${this.plugin}"`
      )
    }
    return new IconLoader(this.plugin, name, this.baseUrl, relPath)
  }
}
