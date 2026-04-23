import { SupabaseClient } from "@supabase/supabase-js";
import { OTXPulse, ThreatIntelEntry } from "../types";
import { v4 as uuidv4 } from "uuid";

const OTX_BASE_URL = "https://otx.alienvault.com/api/v1";

export async function fetchOTXPulses(days_back: number = 7): Promise<OTXPulse[]> {
  const apiKey = process.env.OTX_API_KEY;
  if (!apiKey) {
    console.warn("[otx] OTX_API_KEY not set, skipping pulse fetch");
    return [];
  }

  const date = new Date(Date.now() - days_back * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    const res = await fetch(`${OTX_BASE_URL}/pulses/subscribed?limit=50&modified_since=${date}`, {
      headers: { "X-OTX-API-KEY": apiKey }
    });

    if (!res.ok) throw new Error(`OTX pulses fetch failed: ${res.statusText}`);
    
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("[otx] Error fetching pulses:", error);
    return [];
  }
}

export async function fetchOTXIndicatorsForIP(ip: string): Promise<ThreatIntelEntry | null> {
  const apiKey = process.env.OTX_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${OTX_BASE_URL}/indicators/IPv4/${ip}/general`, {
      headers: { "X-OTX-API-KEY": apiKey }
    });

    if (!res.ok) return null;
    const data = await res.json();
    
    const pulseCount = data.pulse_info?.count || 0;
    if (pulseCount === 0) return null;

    let confidence = 40;
    if (pulseCount >= 2 && pulseCount <= 5) confidence = 70;
    else if (pulseCount > 5) confidence = 90;

    return {
      id: uuidv4(),
      source: "otx",
      ioc_type: "ip",
      value: ip,
      threat_type: "Malicious IP",
      confidence,
      severity: confidence > 70 ? "high" : "medium",
      tags: data.pulse_info?.pulses?.flatMap((p: any) => p.tags) || [],
      mitre_techniques: [],
      first_seen: new Date(),
      last_seen: new Date(),
      expiry: null,
      active: true,
      raw_data: data,
      case_id: null
    };
  } catch (error) {
    return null;
  }
}

export async function fetchOTXIndicatorsForDomain(domain: string): Promise<ThreatIntelEntry | null> {
    const apiKey = process.env.OTX_API_KEY;
    if (!apiKey) return null;
  
    try {
      const res = await fetch(`${OTX_BASE_URL}/indicators/domain/${domain}/general`, {
        headers: { "X-OTX-API-KEY": apiKey }
      });
  
      if (!res.ok) return null;
      const data = await res.json();
      
      const pulseCount = data.pulse_info?.count || 0;
      if (pulseCount === 0) return null;
  
      let confidence = 40;
      if (pulseCount >= 2 && pulseCount <= 5) confidence = 70;
      else if (pulseCount > 5) confidence = 90;
  
      return {
        id: uuidv4(),
        source: "otx",
        ioc_type: "domain",
        value: domain,
        threat_type: "Malicious Domain",
        confidence,
        severity: confidence > 70 ? "high" : "medium",
        tags: data.pulse_info?.pulses?.flatMap((p: any) => p.tags) || [],
        mitre_techniques: [],
        first_seen: new Date(),
        last_seen: new Date(),
        expiry: null,
        active: true,
        raw_data: data,
        case_id: null
      };
    } catch (error) {
      return null;
    }
}

export async function syncOTXFeed(supabase: SupabaseClient): Promise<number> {
  const pulses = await fetchOTXPulses(1);
  let newEntries = 0;

  for (const pulse of pulses) {
    for (const indicator of pulse.indicators) {
      let iocType: any = null;
      if (indicator.type === "IPv4") iocType = "ip";
      else if (indicator.type === "domain" || indicator.type === "hostname") iocType = "domain";
      else if (["FileHash-MD5", "FileHash-SHA1", "FileHash-SHA256"].includes(indicator.type)) iocType = "hash";
      else if (indicator.type === "email") iocType = "email";
      else if (indicator.type === "URL") iocType = "url";

      if (!iocType) continue;

      const { data: existing } = await supabase
        .from("threat_intel")
        .select("id")
        .eq("value", indicator.indicator)
        .maybeSingle();

      const entryData = {
        source: "otx",
        ioc_type: iocType,
        value: indicator.indicator,
        threat_type: "OTX Pulse Indicator",
        confidence: 70,
        severity: "medium",
        tags: pulse.tags,
        last_seen: new Date().toISOString(),
        raw_data: indicator,
        active: true
      };

      if (!existing) {
        await supabase.from("threat_intel").insert({
          ...entryData,
          id: uuidv4(),
          first_seen: new Date().toISOString()
        });
        newEntries++;
      } else {
        await supabase.from("threat_intel").update(entryData).eq("id", existing.id);
      }
    }
  }

  return newEntries;
}
