import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Configurar conexión Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Tipos para TypeScript
export interface Interaccion {
  id?: string; // UUID
  usuario: string;
  entrada: string;
  salida: string;
  fecha?: Date;
}

export interface PerfilUsuarioSintetico {
  id?: number;
  nombre: string;
  rol: string;
  nivel_ia: number;
  tono: string;
  metas: string[];
  frustraciones: string[];
  estilo_decision: string;
  configuracion?: Record<string, any>;
  activo?: boolean;
  fecha_creacion?: Date;
}

// Funciones de utilidad para Supabase
export class SupabaseManager {
  // Guardar interacción
  static async guardarInteraccion(interaccion: Interaccion) {
    try {
      const { data, error } = await supabase
        .from("registro_interacciones")
        .insert({
          usuario: interaccion.usuario,
          entrada: interaccion.entrada,
          salida: interaccion.salida,
          fecha: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error("Error guardando interacción:", error);
        return null;
      }

      return data[0];
    } catch (error) {
      console.error("Error inesperado:", error);
      return null;
    }
  }

  // Obtener perfil de usuario sintético
  static async obtenerPerfil(nombre: string): Promise<PerfilUsuarioSintetico | null> {
    try {
      const { data, error } = await supabase
        .from("perfiles_usuarios_sinteticos")
        .select("*")
        .eq("nombre", nombre)
        .eq("activo", true)
        .single();

      if (error) {
        console.error("Error obteniendo perfil:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error inesperado:", error);
      return null;
    }
  }

  // Obtener historial de interacciones
  static async obtenerHistorial(usuario: string, limite: number = 10) {
    try {
      const { data, error } = await supabase
        .from("registro_interacciones")
        .select("*")
        .eq("usuario", usuario)
        .order("fecha", { ascending: false })
        .limit(limite);

      if (error) {
        console.error("Error obteniendo historial:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error inesperado:", error);
      return [];
    }
  }
}
