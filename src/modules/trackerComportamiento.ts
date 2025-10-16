import { createClient } from "@supabase/supabase-js";

// Función para obtener cliente de Supabase
function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

export async function registrarEvento(evento: string, descripcion: string, confianza = 100) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("tracking_valeria").insert({
      evento,
      descripcion,
      confianza,
      fecha: new Date()
    });
    console.log(`📊 Evento registrado: ${evento} (${confianza}%)`);
  } catch (error) {
    console.error(`❌ Error registrando evento ${evento}:`, error);
  }
}
