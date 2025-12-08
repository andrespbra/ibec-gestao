
import { GoogleGenAI, Type } from "@google/genai";

// Helper to get API Key safely from either process.env (injected by Vite define) or import.meta.env (Vite native)
const getApiKey = (): string => {
  // First try process.env (polyfilled)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // Fallback to Vite native env
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  return '';
};

const API_KEY = getApiKey();

// Initialize the SDK with the retrieved API Key
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface RouteEstimate {
  distanceKm: number;
  durationMins: number;
}

/**
 * Uses Gemini to estimate the distance between two addresses, optionally including waypoints.
 */
export const estimateRoute = async (origin: string, destination: string, waypoints: string[] = []): Promise<RouteEstimate> => {
  // Check if API Key is available specifically when the function is called
  if (!API_KEY) {
    console.error("Gemini API Key is missing.");
    console.error("Please create a .env file in the root directory with: VITE_API_KEY=your_key_here");
    throw new Error("Chave de API não encontrada. Crie um arquivo .env na raiz com VITE_API_KEY=...");
  }

  try {
    const hasWaypoints = waypoints.length > 0;
    const stopsString = hasWaypoints ? ` passing through [${waypoints.join(', ')}] ` : ' ';
    
    console.log(`Estimating route: ${origin} ->${stopsString}-> ${destination}...`);
    
    const prompt = `Calculate the total estimated driving distance (in kilometers) and duration (in minutes) for a trip starting at "${origin}",${stopsString}and ending at "${destination}". Consider the most efficient driving route visiting these stops in order.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distanceKm: { type: Type.NUMBER, description: "The total distance in kilometers." },
            durationMins: { type: Type.NUMBER, description: "The total duration in minutes." }
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
