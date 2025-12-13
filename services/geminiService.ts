
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the SDK with the API Key from environment variables.
// The API key must be obtained exclusively from process.env.API_KEY.
let ai: GoogleGenAI | null = null;

try {
  // Check if key exists and is not empty to avoid "API key is missing" error on initialization
  if (process.env.API_KEY && process.env.API_KEY.length > 0) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
  }
} catch (error) {
  console.error("Error initializing Gemini SDK:", error);
}

export interface RouteEstimate {
  distanceKm: number;
  durationMins: number;
}

/**
 * Uses Gemini to estimate the distance between two addresses, optionally including waypoints.
 */
export const estimateRoute = async (origin: string, destination: string, waypoints: string[] = []): Promise<RouteEstimate> => {
  if (!ai) {
    // Graceful fallback if AI is not initialized
    console.warn("Gemini AI not initialized. Returning manual input requirement.");
    throw new Error("Chave de API do Gemini não configurada. Por favor, insira a distância manualmente.");
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
