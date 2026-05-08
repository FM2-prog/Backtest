import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function auditTrades(trades: Trade[]) {
  if (trades.length === 0) return "No hay operaciones para auditar aún.";

  const prompt = `
    Como un Auditor de Trading experto, analiza esta serie de operaciones de backtesting basadas en Reversión técnica.
    
    Operaciones:
    ${JSON.stringify(trades.slice(-20), null, 2)}
    
    Analiza:
    1. Sesgos emocionales detectados (basado en el campo 'emotion' y 'notes').
    2. Cumplimiento de la estrategia (patrones de velas y gestión técnica).
    3. Gestión de riesgo (Stop Loss y Take Profit).
    4. Sugerencia de optimización específica para evitar "overtrading" o sesgos detectados.
    
    Respuesta en español, tono profesional y directo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return "Error al generar la auditoría de Gemini.";
  }
}
