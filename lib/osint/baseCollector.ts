import { OsintTarget, CollectorResult } from "./types";

export abstract class BaseCollector {
  abstract name: string;
  abstract collect(target: OsintTarget): Promise<CollectorResult>;

  protected async safeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s default timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timeout);
      console.error(`[${this.name}] Request failed:`, err.message);
      return null;
    }
  }
}
