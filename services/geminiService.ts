
// Fix: Strictly follow GoogleGenAI initialization and model naming conventions
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the SDK with the API Key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface RouteEstimate {
  distanceKm: number;
  durationMins: number;
}

/**
 * Uses Gemini to estimate the distance between two addresses, optionally including waypoints.
 */
export const estimateRoute = async (origin: string, destination: string, waypoints: string[] = []): Promise<RouteEstimate> => {
  try {
    const hasWaypoints = waypoints.length > 0;
    const stopsString = hasWaypoints ? ` passing through [${waypoints.join(', ')}] ` : ' ';
    
    console.log(`Estimating route: ${origin} ->${stopsString}-> ${destination}...`);
    
    const prompt = `Calculate the total estimated driving distance (in kilometers) and duration (in minutes) for a trip starting at "${origin}",${stopsString}and ending at "${destination}". Consider the most efficient driving route visiting these stops in order.`;

    // Fix: Using gemini-3-flash-preview for basic text task
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

    // Fix: Access .text property directly (not a method)
    const text = response.text;
    if (text) {
      // Sanitize response: remove Markdown code blocks if present
      let cleanJson = text.trim();
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
