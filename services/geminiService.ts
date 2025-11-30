import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface RouteEstimate {
  distanceKm: number;
  durationMins: number;
}

/**
 * Uses Gemini to estimate the distance between two addresses.
 * Note: In a production environment with Google Maps API, this would use the Distance Matrix API.
 * Here we use Gemini's knowledge base to estimate reasonable distances.
 */
export const estimateRoute = async (origin: string, destination: string): Promise<RouteEstimate> => {
  try {
    const prompt = `Estimate the driving distance in kilometers and duration in minutes between "${origin}" and "${destination}". Assume a standard route.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distanceKm: { type: Type.NUMBER, description: "Estimated driving distance in kilometers" },
            durationMins: { type: Type.NUMBER, description: "Estimated driving duration in minutes" }
          },
          required: ["distanceKm", "durationMins"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data as RouteEstimate;
    }

    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("AI Estimation Error:", error);
    // Fallback/Mock for demo purposes if AI fails
    return { distanceKm: 0, durationMins: 0 };
  }
};
