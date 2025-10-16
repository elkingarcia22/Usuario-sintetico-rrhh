import { createClient } from "@supabase/supabase-js";

// Función para obtener cliente de Supabase
function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

// Variable para almacenar el Project ID de Clarity
let clarityProjectId: string | null = null;

// Función para inicializar Clarity
export function iniciarClarity(projectId: string) {
  clarityProjectId = projectId;
  console.log(`📊 Clarity inicializado con Project ID: ${projectId}`);
  
  // Registrar evento de inicialización
  registrarEventoClarity("clarity_inicializado", `Clarity configurado con Project ID: ${projectId}`, 100);
}

// Función para registrar interacciones en Clarity
export async function registrarInteraccionClarity(evento: string, descripcion: string, confianza = 95) {
  if (!clarityProjectId) {
    console.warn("⚠️ Clarity no está inicializado. Llama a iniciarClarity() primero.");
    return;
  }

  try {
    // Simular envío a Clarity (en un caso real, aquí harías la llamada HTTP a Clarity)
    console.log(`📊 [Clarity] Evento: ${evento} - ${descripcion} (${confianza}%)`);
    
    // Guardar en Supabase para tracking
    await registrarEventoClarity(`clarity_${evento}`, descripcion, confianza);
    
    // En un caso real, aquí harías algo como:
    // await fetch(`https://c.clarity.ms/collect`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     projectId: clarityProjectId,
    //     event: evento,
    //     description: descripcion,
    //     confidence: confianza,
    //     timestamp: new Date().toISOString()
    //   })
    // });
    
  } catch (error) {
    console.error(`❌ Error registrando en Clarity:`, error);
  }
}

// Función auxiliar para registrar eventos en Supabase
async function registrarEventoClarity(evento: string, descripcion: string, confianza: number) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("tracking_valeria").insert({
      evento,
      descripcion: `[Clarity] ${descripcion}`,
      confianza,
      fecha: new Date(),
      metadata: {
        source: "clarity",
        projectId: clarityProjectId
      }
    });
  } catch (error) {
    console.error(`❌ Error guardando evento Clarity en Supabase:`, error);
  }
}

// Función para obtener estadísticas de Clarity
export async function obtenerEstadisticasClarity() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tracking_valeria")
      .select("*")
      .like("evento", "clarity_%")
      .order("fecha", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Error obteniendo estadísticas de Clarity:", error);
      return null;
    }

    // Agrupar eventos por tipo
    const eventosPorTipo = data?.reduce((acc: any, evento: any) => {
      const tipo = evento.evento.replace("clarity_", "");
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(evento);
      return acc;
    }, {}) || {};

    return {
      totalEventos: data?.length || 0,
      eventosPorTipo,
      confianzaPromedio: data?.length ? 
        Math.round(data.reduce((sum: number, e: any) => sum + e.confianza, 0) / data.length) : 0,
      projectId: clarityProjectId
    };
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return null;
  }
}
