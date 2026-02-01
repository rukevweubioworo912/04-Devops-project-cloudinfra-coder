
import { GoogleGenAI, Type } from "@google/genai";

export interface ExplanationResult {
  issue: string;
  cause: string;
  solution: string;
  examples: string[];
}

export const explainCommand = async (command: string): Promise<ExplanationResult> => {
  // Switched to gemini-3-flash-preview for better quota availability during testing
  const modelName = 'gemini-3-flash-preview';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are a world-class Cloud Solutions Architect and DevOps Mentor. 
  A junior engineer needs help understanding a CLI command. This could be a standard Linux shell command or a cloud provider CLI (AWS CLI, Azure CLI, or Google Cloud CLI/gcloud).
  
  Your goal:
  1. Detect the platform (Linux, AWS, Azure, or GCP).
  2. Explain the command clearly for a junior level.
  3. For Cloud CLIs: Briefly mention what resource is being affected and if there are specific IAM permissions usually required.
  4. Use the "issue" field for the Command Name (e.g., 'aws s3 sync' or 'az vm create').
  5. Use the "cause" field to explain the logic and parameters in plain English.
  6. Use the "solution" field to provide a "Cloud Architect Tip" - a best practice or a warning (like cost or security) related to that command.
  7. Provide 3-4 "examples" that are practical, safe, and production-ready.
  
  Format examples as: "command # clear explanation"
  
  You MUST output valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Explain this CLI command like I'm a junior dev: ${command}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issue: { type: Type.STRING },
            cause: { type: Type.STRING },
            solution: { type: Type.STRING },
            examples: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["issue", "cause", "solution", "examples"]
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as ExplanationResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    const message = error?.message || "";
    if (message.includes("leaked") || (message.includes("PERMISSION_DENIED") && message.includes("reported"))) {
      throw new Error("KEY_LEAKED");
    }
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    if (message.includes("Requested entity was not found.") || message.includes("API_KEY_INVALID")) {
      throw new Error("KEY_AUTH_REQUIRED");
    }
    throw error;
  }
};
