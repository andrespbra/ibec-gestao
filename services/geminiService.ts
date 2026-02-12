
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
    const stopsString = hasWaypoints ? ` passing through these stops in order: [${waypoints.join(', ')}] ` : ' ';
    
    console.log(`Estimating route: ${origin} ->${stopsString}-> ${destination}...`);
    
    const prompt = `You are a logistics expert. Calculate the total estimated road distance (in kilometers) and the typical driving duration (in minutes) for a delivery trip.
    Route details:
    - Start: "${origin}"
    - Stops: ${hasWaypoints ? waypoints.join(', ') : 'None'}
    - End: "${destination}"
    
    Return ONLY a JSON object with "distanceKm" and "durationMins". Be as accurate as possible for the region of the addresses. If multiple routes exist, provide the most standard one.`;

    // Using gemini-3-flash-preview for efficiency and reliability in JSON tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distanceKm: { type: Type.NUMBER, description: "Total distance in kilometers. Use decimal numbers if needed." },
            durationMins: { type: Type.NUMBER, description: "Total duration in minutes as an integer." }
          },
          required: ["distanceKm", "durationMins"]
        }
      }
    });

    // Access .text property directly (as per guidelines)
    const text = response.text;
    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }

    let cleanJson = text.trim();
    // Safety check for common markdown wrappers
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '');
    }

    const data = JSON.parse(cleanJson.trim());
    
    console.log("Gemini Estimate Success:", data);

    return {
      distanceKm: parseFloat(data.distanceKm) || 0,
      durationMins: parseInt(data.durationMins) || 0
    };

  } catch (error: any) {
    console.error("Gemini Route Estimation Failed:", error);
    throw new Error(error.message || "Erro ao processar estimativa com IA.");
  }
};
