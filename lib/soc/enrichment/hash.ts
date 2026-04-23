export async function enrichHash(hash: string) {
  try {
    const formData = new URLSearchParams();
    formData.append("query", "get_info");
    formData.append("hash", hash);

    const response = await fetch("https://mb-api.abuse.ch/api/v1/", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error(`MalwareBazaar failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("MalwareBazaar hash enrichment error:", error);
    return { error: String(error) };
  }
}
