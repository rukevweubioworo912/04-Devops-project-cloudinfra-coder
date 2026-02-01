
import { GoogleGenAI, Type } from "@google/genai";

export interface ExplanationResult {
  issue: string;
  cause: string;
  solution: string;
  examples: string[];
}

export const explainCommand = async (command: string): Promise<ExplanationResult> => {
  // Use gemini-3-flash-preview for higher free-tier quota limits
  const modelName = 'gemini-3-flash-preview';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const systemInstruction = `You are a friendly Senior DevOps Mentor. 
  A junior engineer has asked you to explain a Linux command or a log error.
  
  Your goal:
  1. Explain it simply (no unnecessary jargon).
  2. Use the "issue" field for the Command name or Error title.
  3. Use the "cause" field to explain what is happening under the hood in plain English.
  4. Use the "solution" field to give a 'Pro Tip' on when this is actually used in a job.
  5. Provide 3-4 "examples" that are practical and safe to run.
  
  Format examples as: "command # clear explanation"
  
  You MUST output valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: `Explain this like I'm a junior dev: ${command}` }] }],
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
    
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    
    if (message.includes("Requested entity was not found.") || message.includes("API_KEY_INVALID")) {
      throw new Error("KEY_AUTH_REQUIRED");
    }
    
    throw error;
  }
};
