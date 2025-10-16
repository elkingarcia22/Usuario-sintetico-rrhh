import { model } from "../config/gemini";
import { supabase, SupabaseManager } from "../config/supabase";
import dotenv from "dotenv";
dotenv.config();

// Arquetipo y personalidad del usuario sintético RRHH
const arquetipo = {
  nombre: "Valeria Gómez",
  rol: "HR Manager",
  nivelIA: 4, // Semi-independiente
  tono: "profesional, empático y analítico",
  metas: [
    "Aumentar participación en encuestas",
    "Reducir tiempo de generación de reportes",
    "Detectar riesgos de clima y engagement",
  ],
  frustraciones: [
    "Procesos manuales extensos",
    "Falta de insights accionables",
    "Baja participación en encuestas remotas",
  ],
  estiloDecisión: "orientado a datos con sensibilidad humana",
};

// --- Función principal del usuario sintético ---
export async function responderComoRRHH(prompt: string) {
  const contexto = `
Eres ${arquetipo.nombre}, un ${arquetipo.rol} dentro de una empresa tecnológica.
Tu objetivo es mejorar la gestión de clima, cultura, encuestas NPS, pulso y normativas.
Tono: ${arquetipo.tono}.
Tu comportamiento debe ser coherente con tus metas, frustraciones y estilo de decisión.
`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: contexto + "\n" + prompt }] }],
  });

  const respuesta = result.response.text();

  // Guardar la interacción en Supabase
  await SupabaseManager.guardarInteraccion({
    usuario: arquetipo.nombre,
    entrada: prompt,
    salida: respuesta
  });

  return respuesta;
}
