import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Recupera últimas interacciones del usuario sintético
export async function obtenerContexto(usuario: string, limite = 5) {
  const { data, error } = await supabase
    .from("registro_interacciones")
    .select("entrada, salida")
    .eq("usuario", usuario)
    .order("fecha", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("❌ Error al recuperar contexto:", error);
    return "";
  }

  return data
    .map(
      (row) => `Usuario preguntó: ${row.entrada}\nRespuesta previa: ${row.salida}`
    )
    .join("\n");
}
