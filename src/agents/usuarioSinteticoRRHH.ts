import { model } from "../config/gemini";
import { supabase, SupabaseManager } from "../config/supabase";
import { obtenerContexto } from "../modules/memoriaContextual";
import { simularDecision, analizarPatronesDecisiones } from "../modules/simuladorDecisiones";
import { registrarEvento } from "../modules/trackerComportamiento.js";
import { iniciarClarity, registrarInteraccionClarity } from "../modules/trackerVisual.js";
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

// Inicializar Clarity al cargar el módulo
if (process.env.CLARITY_PROJECT_ID) {
  iniciarClarity(process.env.CLARITY_PROJECT_ID);
} else {
  console.warn("⚠️ CLARITY_PROJECT_ID no configurado. Clarity no estará disponible.");
}

// --- Función principal del usuario sintético ---
export async function responderComoRRHH(prompt: string) {
  // Registrar inicio de respuesta en Clarity
  await registrarInteraccionClarity("inicio_respuesta", "Valeria comenzó a procesar un prompt");
  
  const contextoPrevio = await obtenerContexto(arquetipo.nombre);

  const contexto = `
Eres ${arquetipo.nombre}, un ${arquetipo.rol} dentro de una empresa tecnológica.
Tu objetivo es mejorar la gestión de clima, cultura, encuestas NPS, pulso y normativas.
Tono: ${arquetipo.tono}.
Tu comportamiento debe ser coherente con tus metas, frustraciones y estilo de decisión.

Historial reciente:
${contextoPrevio || "(sin historial previo)"}
`;

  // Registrar procesamiento de contexto en Clarity
  await registrarInteraccionClarity("procesando_contexto", `Contexto recuperado: ${contextoPrevio ? 'Sí' : 'No'}`);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: contexto + "\n" + prompt }] }],
  });

  const respuesta = result.response.text();

  // Registrar generación de respuesta en Clarity
  await registrarInteraccionClarity("generando_respuesta", `Respuesta generada con ${respuesta.length} caracteres`);

  await supabase.from("registro_interacciones").insert({
    usuario: arquetipo.nombre,
    entrada: prompt,
    salida: respuesta,
    fecha: new Date(),
  });

  await registrarEvento(
    "respuesta_generada",
    `Valeria respondió a un prompt: "${prompt.substring(0, 60)}..."`,
    Math.floor(Math.random() * (100 - 70 + 1)) + 70 // confianza simulada 70–100
  );

  // Registrar finalización de respuesta en Clarity
  await registrarInteraccionClarity("fin_respuesta", "Valeria completó una respuesta IA");

  return respuesta;
}

// --- Función para analizar patrones de decisiones ---
export async function analizarComportamiento() {
  return await analizarPatronesDecisiones(arquetipo.nombre);
}
