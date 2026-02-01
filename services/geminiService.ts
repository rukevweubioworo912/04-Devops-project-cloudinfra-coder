
import { GoogleGenAI, Type } from "@google/genai";

export interface InfraResult {
  title: string;
  explanation: string;
  bestPractices: string;
  terraform: string;
  kubernetes: string;
}

// Helper to get the API key from runtime window config (injected via config.js)
const getApiKey = () => {
  const apiKey = (window as any).APP_CONFIG?.API_KEY;
  if (!apiKey) {
    console.error("API_KEY not found in window.APP_CONFIG. Ensure config.js is loaded with VITE_API_KEY env var.");
  }
  return apiKey;
};

export const generateInfra = async (prompt: string): Promise<InfraResult> => {
  const modelName = 'gemini-3-flash-preview';
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("KEY_AUTH_REQUIRED");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are a Senior Cloud Infrastructure Architect and DevOps Lead.
  Your task is to generate production-ready Infrastructure as Code (IaC).
  
  Inputs will describe a cloud setup (AWS, Azure, or GCP).
  Outputs MUST include:
  1. A descriptive 'title' for the project.
  2. A brief architectural 'explanation'.
  3. A section of 'bestPractices' focusing on security, scalability, and cost.
  4. 'terraform': A complete, valid Terraform (.tf) script including providers, variables, and resources.
  5. 'kubernetes': A complete, valid Kubernetes manifest (.yaml) if applicable to the request (e.g., if it involves clusters, pods, or services). If not applicable, provide a basic namespace or deployment example.

  Ensure Terraform uses modern syntax and Kubernetes uses stable API versions.
  Support AWS, Azure, and Google Cloud Platform.
  
  You MUST output valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Generate IaC for this request: ${prompt}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            explanation: { type: Type.STRING },
            bestPractices: { type: Type.STRING },
            terraform: { type: Type.STRING },
            kubernetes: { type: Type.STRING }
          },
          required: ["title", "explanation", "bestPractices", "terraform", "kubernetes"]
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as InfraResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const message = error?.message || "";
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    if (message.includes("Requested entity was not found.") || message.includes("API_KEY_INVALID") || message.includes("API key not found")) {
      throw new Error("KEY_AUTH_REQUIRED");
    }
    throw error;
  }
};
