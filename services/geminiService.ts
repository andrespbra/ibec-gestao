import { GoogleGenAI, Type } from "@google/genai";

// Declare process variable to satisfy TypeScript and access the API key injected by Vite
declare var process: {
  env: {
    API_KEY: string;
  };
};

// Initialize the SDK with the API Key directly from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface RouteEstimate {
  distanceKm: number;
  durationMins: number;
}

/**
 * Uses Gemini to estimate the distance between two addresses.
 */
export const estimateRoute = async (origin: string, destination: string): Promise<RouteEstimate> => {
  // Check if API Key is available specifically when the function is called
  if (!process.env.API_KEY) {
    console.error("Gemini API Key is missing.");
    console.error("Please create a .env file in the root directory with: VITE_API_KEY=your_key_here");
    throw new Error("Chave de API não configurada. Crie um arquivo .env com VITE_API_KEY=...");
  }

  try {
    console.log(`Estimating route: ${origin} to ${destination}...`);
    
    const prompt = `Calculate the estimated driving distance (in kilometers) and duration (in minutes) between "${origin}" and "${destination}".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distanceKm: { type: Type.NUMBER, description: "The distance in kilometers." },
            durationMins: { type: Type.NUMBER, description: "The duration in minutes." }
          },
          required: ["distanceKm", "durationMins"]
        }
      }
    });

    if (response.text) {
      // Sanitize response: remove Markdown code blocks if present
      let cleanJson = response.text.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '');
      }

      const data = JSON.parse(cleanJson);
      
      console.log("Gemini Estimate Success:", data);

      return {
        distanceKm: Number(data.distanceKm) || 0,
        durationMins: Number(data.durationMins) || 0
      };
    }

    throw new Error("No text content in AI response");
  } catch (error: any) {
    console.error("Gemini Route Estimation Failed:", error);
    // Return a user-friendly error message
    throw new Error(error.message || "Falha ao calcular rota.");
  }
};