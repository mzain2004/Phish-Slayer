import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";

export class IPGeoCollector extends BaseCollector {
  name = "IP Geolocation";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const ip = target.value;
    
    // Private IP check
    const isPrivate = /^(10\.|127\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(ip);
    if (isPrivate) {
      return { collector: this.name, success: true, data: { isPrivate: true }, iocs: [] };
    }

    const data = await this.safeRequest(`http://ip-api.com/json/${ip}`);
    
    if (!data || data.status === 'fail') {
      return { collector: this.name, success: false, data: null, iocs: [], error: data?.message || 'Geofetch failed' };
    }

    return {
      collector: this.name,
      success: true,
      data: {
        country: data.country,
        city: data.city,
        lat: data.lat,
        lon: data.lon,
        isp: data.isp,
        org: data.org,
        asn: data.as
      },
      iocs: []
    };
  }
}
