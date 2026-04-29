import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";

export class WaybackCollector extends BaseCollector {
  name = "Wayback Machine";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const url = `http://web.archive.org/cdx/search/cdx?url=${target.value}&output=json&limit=10&fl=timestamp,statuscode`;
    const data = await this.safeRequest(url);

    if (!data || !Array.isArray(data) || data.length <= 1) {
      return { collector: this.name, success: true, data: { snapshotCount: 0 }, iocs: [] };
    }

    // Skip headers
    const samples = data.slice(1).map(row => ({ timestamp: row[0], status: row[1] }));

    return {
      collector: this.name,
      success: true,
      data: {
        snapshotCount: samples.length,
        oldestSnapshot: samples[0]?.timestamp,
        latestSnapshot: samples[samples.length - 1]?.timestamp,
        samples
      },
      iocs: []
    };
  }
}
