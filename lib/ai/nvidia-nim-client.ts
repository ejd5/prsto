/**
 * NVIDIA NIM AI client interface
 * Integrates with standard OpenAI-compatible endpoints hosted on NVIDIA NIM services.
 */
export async function queryNvidiaNim(prompt: string, responseFormatJson: boolean = false): Promise<any> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY || "";
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";
  const model = process.env.NVIDIA_NIM_MODEL || "meta/llama3-70b-instruct";

  if (!apiKey) {
    // Graceful fallback for dev or mock testing
    console.warn("NVIDIA_NIM_API_KEY not configured. Returning stub values.");
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: responseFormatJson ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA NIM HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (responseFormatJson) {
      return JSON.parse(content);
    }
    return content;
  } catch (error) {
    console.error("Error calling NVIDIA NIM:", error);
    return null;
  }
}
