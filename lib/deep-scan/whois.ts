export interface WhoisResult {
  domain: string;
  registrar: string | null;
  creation_date: string | null;
  expiry_date: string | null;
  updated_date: string | null;
  registrant_country: string | null;
  name_servers: string[];
  status: string[];
  raw: Record<string, unknown> | null;
}

function stripDomain(input: string): string {
  let d = input.trim();
  d = d.replace(/^https?:\/\//i, '');
  d = d.replace(/^www\./i, '');
  d = d.replace(/\/+$/, '');
  d = d.split('/')[0];
  return d;
}

// Extract a date from RDAP events array by eventAction name
function extractEventDate(
  events: { eventAction?: string; eventDate?: string }[] | undefined,
  action: string
): string | null {
  if (!Array.isArray(events)) return null;
  const ev = events.find(
    (e) => e.eventAction?.toLowerCase() === action.toLowerCase()
  );
  return ev?.eventDate || null;
}

// Extract the registrar name from RDAP entities
function extractRegistrar(
  entities: RdapEntity[] | undefined
): string | null {
  if (!Array.isArray(entities)) return null;
  const registrarEntity = entities.find(
    (e) => Array.isArray(e.roles) && e.roles.includes('registrar')
  );
  if (!registrarEntity) return null;

  // Try vcardArray first: vcardArray[1] contains an array of vcard properties
  if (Array.isArray(registrarEntity.vcardArray) && Array.isArray(registrarEntity.vcardArray[1])) {
    const props = registrarEntity.vcardArray[1] as unknown[][];
    const fnProp = props.find(
      (p) => Array.isArray(p) && p[0] === 'fn'
    );
    if (fnProp && fnProp.length >= 4) {
      return String(fnProp[3]);
    }
  }

  // Fallback: check for handle or name
  return registrarEntity.handle || null;
}

// Extract registrant country from RDAP entities
function extractRegistrantCountry(
  entities: RdapEntity[] | undefined
): string | null {
  if (!Array.isArray(entities)) return null;
  const registrant = entities.find(
    (e) => Array.isArray(e.roles) && e.roles.includes('registrant')
  );
  if (!registrant) return null;

  if (Array.isArray(registrant.vcardArray) && Array.isArray(registrant.vcardArray[1])) {
    const props = registrant.vcardArray[1] as unknown[][];
    const adrProp = props.find(
      (p) => Array.isArray(p) && p[0] === 'adr'
    );
    if (adrProp && Array.isArray(adrProp[3]) && adrProp[3].length >= 7) {
      const country = adrProp[3][6];
      if (typeof country === 'string' && country.length > 0) {
        return country;
      }
    }
  }
  return null;
}

interface RdapEntity {
  roles?: string[];
  vcardArray?: [string, unknown[][]];
  handle?: string;
}

interface RdapResponse {
  ldhName?: string;
  events?: { eventAction?: string; eventDate?: string }[];
  entities?: RdapEntity[];
  nameservers?: { ldhName?: string }[];
  status?: string[];
}

async function fetchRdap(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/rdap+json, application/json' },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function parseRdapResponse(data: RdapResponse, cleanDomain: string): WhoisResult {
  return {
    domain: data.ldhName || cleanDomain,
    registrar: extractRegistrar(data.entities),
    creation_date: extractEventDate(data.events, 'registration'),
    expiry_date: extractEventDate(data.events, 'expiration'),
    updated_date: extractEventDate(data.events, 'last changed'),
    registrant_country: extractRegistrantCountry(data.entities),
    name_servers: Array.isArray(data.nameservers)
      ? data.nameservers
          .map((ns) => ns.ldhName || '')
          .filter(Boolean)
      : [],
    status: Array.isArray(data.status) ? data.status : [],
    raw: data as unknown as Record<string, unknown>,
  };
}

export async function getWhoisData(domain: string): Promise<WhoisResult> {
  const cleanDomain = stripDomain(domain);

  const fallback: WhoisResult = {
    domain: cleanDomain,
    registrar: null,
    creation_date: null,
    expiry_date: null,
    updated_date: null,
    registrant_country: null,
    name_servers: [],
    status: [],
    raw: null,
  };

  // Primary: RDAP via rdap.org
  try {
    const res = await fetchRdap(
      `https://rdap.org/domain/${encodeURIComponent(cleanDomain)}`,
      8000
    );
    if (res.ok) {
      const data: RdapResponse = await res.json();
      return parseRdapResponse(data, cleanDomain);
    }
  } catch {
    // Primary failed — fall through to fallback
  }

  // Fallback: Verisign RDAP for .com domains
  if (cleanDomain.endsWith('.com')) {
    try {
      const res = await fetchRdap(
        `https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(cleanDomain)}`,
        8000
      );
      if (res.ok) {
        const data: RdapResponse = await res.json();
        return parseRdapResponse(data, cleanDomain);
      }
    } catch {
      // Fallback also failed
    }
  }

  return fallback;
}
