export async function enrichDomain(domain: string) {
  const apiKey = process.env.VIRUS_TOTAL_API_KEY;
  if (!apiKey) {
    return { error: "Missing VIRUS_TOTAL_API_KEY" };
  }

  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`,
      {
        method: "GET",
        headers: {
          "x-apikey": apiKey,
        },
      }
    );

    if (response.status === 404) {
      return { not_found: true };
    }

    if (!response.ok) {
      throw new Error(`VirusTotal failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("VirusTotal domain enrichment error:", error);
    return { error: String(error) };
  }
}
