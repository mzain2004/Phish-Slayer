export async function enrichIP(ip: string) {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) {
    return { error: "Missing ABUSEIPDB_API_KEY" };
  }

  try {
    const response = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose=true`,
      {
        method: "GET",
        headers: {
          Key: apiKey,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`AbuseIPDB failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("AbuseIPDB enrichment error:", error);
    return { error: String(error) };
  }
}
