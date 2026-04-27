export interface GeoData {
  country: string;
  countryCode: string;
  city: string;
  isp: string;
  org: string;
  asn: string;
  lat: number;
  lon: number;
  timezone: string;
}

const geoCache = new Map<string, { data: GeoData; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour
const MAX_CACHE_SIZE = 100;

function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  return false;
}

let lastRequestTime = 0;
const RATE_LIMIT_MS = 1500; // ~40 requests per minute

export async function geolocateIp(ip: string): Promise<GeoData | null> {
  if (isPrivateIp(ip)) return null;

  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Rate limit guard
  const now = Date.now();
  const waitTime = Math.max(0, RATE_LIMIT_MS - (now - lastRequestTime));
  if (waitTime > 0) await new Promise(resolve => setTimeout(resolve, waitTime));
  lastRequestTime = Date.now();

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city,isp,org,as,lat,lon,timezone`);
    if (!response.ok) return null;
    const data = await response.json();

    if (data.status === 'fail') return null;

    const geoData: GeoData = {
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      isp: data.isp,
      org: data.org,
      asn: data.as,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
    };

    if (geoCache.size >= MAX_CACHE_SIZE) {
      const firstKey = geoCache.keys().next().value;
      if (firstKey !== undefined) geoCache.delete(firstKey);
    }
    geoCache.set(ip, { data: geoData, timestamp: Date.now() });

    return geoData;
  } catch (error) {
    console.error(`GeoIP lookup failed for ${ip}:`, error);
    return null;
  }
}
