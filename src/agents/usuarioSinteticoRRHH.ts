import { model } from "../config/gemini";
import { supabase, SupabaseManager } from "../config/supabase";
import { obtenerContexto } from "../modules/memoriaContextual";
import { simularDecision, analizarPatronesDecisiones } from "../modules/simuladorDecisiones";
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
  // Obtener contexto de conversaciones anteriores
  const contextoAnterior = await obtenerContexto(arquetipo.nombre, 3);
  
  const contexto = `
Eres ${arquetipo.nombre}, un ${arquetipo.rol} dentro de una empresa tecnológica.
Tu objetivo es mejorar la gestión de clima, cultura, encuestas NPS, pulso y normativas.
Tono: ${arquetipo.tono}.
Tu comportamiento debe ser coherente con tus metas, frustraciones y estilo de decisión.

CONTEXTO DE CONVERSACIONES ANTERIORES:
${contextoAnterior ? contextoAnterior : "Esta es la primera interacción."}

PERSONALIDAD:
- Metas: ${arquetipo.metas.join(", ")}
- Frustraciones: ${arquetipo.frustraciones.join(", ")}
- Estilo de decisión: ${arquetipo.estiloDecisión}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: contexto + "\n" + prompt }] }],
    });

    const respuesta = result.response.text();

    // Simular una decisión basada en la interacción
    const decision = await simularDecision(arquetipo.nombre, prompt, {
      tono: arquetipo.tono,
      metas: arquetipo.metas,
      frustraciones: arquetipo.frustraciones,
      estiloDecisión: arquetipo.estiloDecisión
    });

    // Guardar la interacción en Supabase
    await SupabaseManager.guardarInteraccion({
      usuario: arquetipo.nombre,
      entrada: prompt,
      salida: respuesta
    });

    // Agregar información de la decisión a la respuesta
    const respuestaConDecision = `${respuesta}\n\n💡 DECISIÓN SIMULADA (Confianza: ${decision.confianza}%):\n${decision.decision}\n\n🧠 RAZONAMIENTO:\n${decision.razonamiento}`;

    return respuestaConDecision;
  } catch (error) {
    console.error("❌ Error en IA:", error);
    
    // Respuesta de fallback con decisión simulada
    const decision = await simularDecision(arquetipo.nombre, prompt, {
      tono: arquetipo.tono,
      metas: arquetipo.metas,
      frustraciones: arquetipo.frustraciones,
      estiloDecisión: arquetipo.estiloDecisión
    });

    const respuestaFallback = `Hola, soy ${arquetipo.nombre}. Como ${arquetipo.rol}, estoy experimentando problemas técnicos, pero puedo ayudarte con mi experiencia. Mi enfoque es ${arquetipo.estiloDecisión}.\n\n💡 DECISIÓN SIMULADA (Confianza: ${decision.confianza}%):\n${decision.decision}\n\n🧠 RAZONAMIENTO:\n${decision.razonamiento}`;

    return respuestaFallback;
  }
}

// --- Función para analizar patrones de decisiones ---
export async function analizarComportamiento() {
  return await analizarPatronesDecisiones(arquetipo.nombre);
}
