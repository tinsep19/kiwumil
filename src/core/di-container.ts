/**
 * DiContainer: 軽量 DI Container
 * 
 * Diagram スコープでサービスを管理します。
 * 各 Diagram ごとに新しい Container インスタンスを作成することで、
 * Diagram 間の分離を実現します。
 */
export class DiContainer {
  private readonly services = new Map<string, unknown>()
  private readonly factories = new Map<string, () => unknown>()

  /**
   * Singleton としてサービスを登録
   * 
   * @param token サービストークン（識別子）
   * @param instance サービスインスタンス
   */
  registerSingleton<T>(token: string, instance: T): void {
    if (this.services.has(token)) {
      throw new Error(`Service '${token}' is already registered`)
    }
    this.services.set(token, instance)
  }

  /**
   * Factory としてサービスを登録
   * 
   * resolve() 時に Factory を実行してインスタンスを生成します。
   * 結果はキャッシュされ、同じインスタンスが返されます。
   * 
   * @param token サービストークン（識別子）
   * @param factory サービスを生成する関数
   */
  registerFactory<T>(token: string, factory: () => T): void {
    if (this.factories.has(token)) {
      throw new Error(`Factory '${token}' is already registered`)
    }
    this.factories.set(token, factory)
  }

  /**
   * サービスを解決
   * 
   * @param token サービストークン（識別子）
   * @returns サービスインスタンス
   * @throws サービスが登録されていない場合
   */
  resolve<T>(token: string): T {
    // Singleton として登録されているか確認
    if (this.services.has(token)) {
      return this.services.get(token) as T
    }

    // Factory として登録されているか確認
    if (this.factories.has(token)) {
      const factory = this.factories.get(token)!
      const instance = factory()
      // Factory の結果をキャッシュ（Singleton 化）
      this.services.set(token, instance)
      this.factories.delete(token)
      return instance as T
    }

    throw new Error(`Service '${token}' is not registered`)
  }

  /**
   * すべてのサービスをクリア
   * 
   * 主にテスト用。Diagram を破棄する際にも使用可能。
   */
  clear(): void {
    this.services.clear()
    this.factories.clear()
  }

  /**
   * サービスが登録されているか確認
   */
  has(token: string): boolean {
    return this.services.has(token) || this.factories.has(token)
  }
}
