import { GoogleGenAI, Type } from "@google/genai";

// Declare process to avoid TypeScript errors in the browser environment
// where Vite polyfills it.
declare var process: {
  env: {
    API_KEY: string;
  };
};

// Initialize the SDK with the API key from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface RouteEstimate {
  distanceKm: number;
  durationMins: number;
}

/**
 * Uses Gemini to estimate the distance between two addresses.
 */
export const estimateRoute = async (origin: string, destination: string): Promise<RouteEstimate> => {
  // Check if API Key is available
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing. Please check your Vercel environment variables (VITE_API_KEY).");
    return { distanceKm: 0, durationMins: 0 };
  }

  try {
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
      const data = JSON.parse(response.text);
      return {
        distanceKm: Number(data.distanceKm) || 0,
        durationMins: Number(data.durationMins) || 0
      };
    }

    throw new Error("No text content in AI response");
  } catch (error) {
    console.error("Gemini Route Estimation Failed:", error);
    // Return default values so the user can continue manually
    return { distanceKm: 0, durationMins: 0 };
  }
};