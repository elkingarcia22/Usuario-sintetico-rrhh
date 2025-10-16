import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Tipos para decisiones simuladas
export interface DecisionSimulada {
  id?: string;
  usuario: string;
  contexto: string;
  decision: string;
  razonamiento: string;
  confianza: number; // 0-100
  fecha: Date;
  metadata?: Record<string, any>;
}

// Simula una decisión basada en el contexto y personalidad del usuario sintético
export async function simularDecision(
  usuario: string,
  contexto: string,
  personalidad: {
    tono: string;
    metas: string[];
    frustraciones: string[];
    estiloDecisión: string;
  }
): Promise<DecisionSimulada> {
  
  // Generar decisión basada en la personalidad
  const decision = generarDecisionContextual(contexto, personalidad);
  const razonamiento = generarRazonamiento(decision, personalidad);
  const confianza = calcularConfianza(contexto, personalidad);

  const decisionSimulada: DecisionSimulada = {
    usuario,
    contexto,
    decision,
    razonamiento,
    confianza,
    fecha: new Date(),
    metadata: {
      modelo: "simulador-decisiones-v1",
      personalidad: personalidad
    }
  };

  // Guardar la decisión en Supabase
  await guardarDecision(decisionSimulada);

  return decisionSimulada;
}

// Genera una decisión contextual basada en la personalidad
function generarDecisionContextual(
  contexto: string,
  personalidad: any
): string {
  const decisiones = [
    "Implementar encuestas de pulso semanales para monitoreo continuo",
    "Crear un programa de reconocimiento peer-to-peer",
    "Establecer sesiones de feedback 360° trimestrales",
    "Desarrollar un sistema de mentoría interna",
    "Implementar políticas de trabajo flexible",
    "Crear canales de comunicación bidireccional",
    "Establecer métricas de engagement en tiempo real",
    "Desarrollar programas de desarrollo profesional",
    "Implementar encuestas de salida estructuradas",
    "Crear comités de cultura organizacional"
  ];

  // Seleccionar decisión basada en contexto y personalidad
  const indice = Math.floor(Math.random() * decisiones.length);
  return decisiones[indice];
}

// Genera el razonamiento detrás de la decisión
function generarRazonamiento(
  decision: string,
  personalidad: any
): string {
  const razonamientos = [
    `Esta decisión se alinea con mi meta de "${personalidad.metas[0]}" y mi estilo ${personalidad.estiloDecisión}.`,
    `Considerando mi frustración con "${personalidad.frustraciones[0]}", esta acción ayudará a resolver el problema de manera sistemática.`,
    `Mi enfoque ${personalidad.estiloDecisión} me lleva a priorizar esta solución que combina datos cuantitativos con sensibilidad humana.`,
    `Esta decisión aborda directamente mi objetivo de "${personalidad.metas[1]}" mientras mantiene mi tono ${personalidad.tono}.`,
    `Basándome en mi experiencia como HR Manager, esta es la mejor estrategia para superar "${personalidad.frustraciones[1]}".`
  ];

  const indice = Math.floor(Math.random() * razonamientos.length);
  return razonamientos[indice];
}

// Calcula el nivel de confianza en la decisión
function calcularConfianza(
  contexto: string,
  personalidad: any
): number {
  // Base de confianza
  let confianza = 70;
  
  // Ajustar basado en contexto
  if (contexto.includes("encuesta") || contexto.includes("participación")) {
    confianza += 15;
  }
  
  if (contexto.includes("clima") || contexto.includes("engagement")) {
    confianza += 10;
  }
  
  if (contexto.includes("remoto") || contexto.includes("virtual")) {
    confianza += 5;
  }
  
  // Ajustar basado en personalidad
  if (personalidad.estiloDecisión.includes("datos")) {
    confianza += 10;
  }
  
  // Mantener entre 0-100
  return Math.min(100, Math.max(0, confianza));
}

// Guarda la decisión en Supabase
async function guardarDecision(decision: DecisionSimulada) {
  try {
    const { data, error } = await supabase
      .from("decisiones_simuladas")
      .insert({
        usuario: decision.usuario,
        contexto: decision.contexto,
        decision: decision.decision,
        razonamiento: decision.razonamiento,
        confianza: decision.confianza,
        fecha: decision.fecha.toISOString(),
        metadata: decision.metadata
      })
      .select();

    if (error) {
      console.error("❌ Error guardando decisión:", error);
    } else {
      console.log("✅ Decisión guardada:", data[0]?.id);
    }
  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
}

// Obtiene el historial de decisiones del usuario
export async function obtenerHistorialDecisiones(
  usuario: string,
  limite = 10
): Promise<DecisionSimulada[]> {
  try {
    const { data, error } = await supabase
      .from("decisiones_simuladas")
      .select("*")
      .eq("usuario", usuario)
      .order("fecha", { ascending: false })
      .limit(limite);

    if (error) {
      console.error("❌ Error obteniendo historial:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return [];
  }
}

// Analiza patrones en las decisiones del usuario
export async function analizarPatronesDecisiones(usuario: string) {
  const decisiones = await obtenerHistorialDecisiones(usuario, 20);
  
  if (decisiones.length === 0) {
    return "No hay suficientes decisiones para analizar patrones.";
  }

  const confianzaPromedio = decisiones.reduce((sum, d) => sum + d.confianza, 0) / decisiones.length;
  const temasFrecuentes = extraerTemasFrecuentes(decisiones);
  
  return {
    totalDecisiones: decisiones.length,
    confianzaPromedio: Math.round(confianzaPromedio),
    temasFrecuentes,
    ultimaDecision: decisiones[0]?.decision,
    tendencia: confianzaPromedio > 75 ? "Alta confianza" : "Confianza moderada"
  };
}

// Extrae temas frecuentes de las decisiones
function extraerTemasFrecuentes(decisiones: DecisionSimulada[]): string[] {
  const temas = [
    "encuestas", "participación", "clima", "engagement", "remoto", 
    "comunicación", "desarrollo", "reconocimiento", "feedback", "cultura"
  ];
  
  const conteoTemas: Record<string, number> = {};
  
  decisiones.forEach(decision => {
    temas.forEach(tema => {
      if (decision.decision.toLowerCase().includes(tema) || 
          decision.contexto.toLowerCase().includes(tema)) {
        conteoTemas[tema] = (conteoTemas[tema] || 0) + 1;
      }
    });
  });
  
  return Object.entries(conteoTemas)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([tema]) => tema);
}
