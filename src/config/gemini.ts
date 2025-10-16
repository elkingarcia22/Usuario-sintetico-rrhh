import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// elegimos el modelo más balanceado en costo y rendimiento
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
