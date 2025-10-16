import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Endpoint principal de rendimiento
app.get("/api/valeria/rendimiento", async (_, res) => {
  try {
    const { data, error } = await supabase.from("resumen_valeria").select("*");
    if (error) {
      console.error("❌ Error obteniendo resumen:", error);
      return res.status(500).json({ 
        ok: false,
        error: error.message 
      });
    }
    
    res.json({
      ok: true,
      data: data || [],
      timestamp: new Date().toISOString(),
      status: "Resumen de rendimiento obtenido exitosamente"
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ 
      ok: false,
      error: "Error inesperado obteniendo rendimiento" 
    });
  }
});

// Endpoint de métricas diarias (consulta directa)
app.get("/api/valeria/metricas-diarias", async (_, res) => {
  try {
    // Consulta directa a la tabla tracking_valeria
    const { data, error } = await supabase
      .from("tracking_valeria")
      .select("evento, confianza, fecha")
      .gte("fecha", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("fecha", { ascending: false });

    if (error) {
      console.error("❌ Error obteniendo métricas diarias:", error);
      return res.status(500).json({ 
        ok: false,
        error: error.message 
      });
    }

    // Procesar datos para agrupar por día
    const metricasPorDia = data?.reduce((acc: any, curr: any) => {
      const fecha = new Date(curr.fecha).toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = {
          fecha: fecha,
          total_eventos: 0,
          interacciones_iniciadas: 0,
          respuestas_generadas: 0,
          respuestas_cache: 0,
          confianza_total: 0,
          confianza_count: 0
        };
      }
      acc[fecha].total_eventos++;
      if (curr.evento === 'interaccion_iniciada') acc[fecha].interacciones_iniciadas++;
      if (curr.evento === 'respuesta_generada') acc[fecha].respuestas_generadas++;
      if (curr.evento === 'respuesta_cache') acc[fecha].respuestas_cache++;
      if (curr.confianza) {
        acc[fecha].confianza_total += curr.confianza;
        acc[fecha].confianza_count++;
      }
      return acc;
    }, {}) || {};

    // Calcular métricas finales
    const resultado = Object.values(metricasPorDia).map((dia: any) => ({
      fecha: dia.fecha,
      total_eventos: dia.total_eventos,
      interacciones_iniciadas: dia.interacciones_iniciadas,
      respuestas_generadas: dia.respuestas_generadas,
      respuestas_cache: dia.respuestas_cache,
      confianza_promedio: dia.confianza_count > 0 ? 
        Math.round((dia.confianza_total / dia.confianza_count) * 100) / 100 : 0
    })).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    res.json({
      ok: true,
      data: resultado,
      timestamp: new Date().toISOString(),
      status: "Métricas diarias obtenidas exitosamente"
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ 
      ok: false,
      error: "Error inesperado obteniendo métricas diarias" 
    });
  }
});

// Endpoint de eventos por tipo (consulta directa)
app.get("/api/valeria/eventos-por-tipo", async (_, res) => {
  try {
    // Consulta directa a la tabla tracking_valeria
    const { data, error } = await supabase
      .from("tracking_valeria")
      .select("evento, confianza, fecha")
      .gte("fecha", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("fecha", { ascending: false });

    if (error) {
      console.error("❌ Error obteniendo eventos por tipo:", error);
      return res.status(500).json({ 
        ok: false,
        error: error.message 
      });
    }

    // Procesar datos para agrupar por tipo de evento
    const eventosPorTipo = data?.reduce((acc: any, curr: any) => {
      if (!acc[curr.evento]) {
        acc[curr.evento] = {
          evento: curr.evento,
          frecuencia: 0,
          confianza_total: 0,
          fechas: []
        };
      }
      acc[curr.evento].frecuencia++;
      acc[curr.evento].confianza_total += curr.confianza;
      acc[curr.evento].fechas.push(curr.fecha);
      return acc;
    }, {}) || {};

    // Calcular métricas finales
    const resultado = Object.values(eventosPorTipo).map((evento: any) => ({
      evento: evento.evento,
      frecuencia: evento.frecuencia,
      confianza_promedio: Math.round((evento.confianza_total / evento.frecuencia) * 100) / 100,
      primera_ocurrencia: Math.min(...evento.fechas.map((f: string) => new Date(f).getTime())),
      ultima_ocurrencia: Math.max(...evento.fechas.map((f: string) => new Date(f).getTime()))
    })).sort((a: any, b: any) => b.frecuencia - a.frecuencia);
    
    res.json({
      ok: true,
      data: resultado,
      timestamp: new Date().toISOString(),
      status: "Eventos por tipo obtenidos exitosamente"
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ 
      ok: false,
      error: "Error inesperado obteniendo eventos por tipo" 
    });
  }
});

// Endpoint de salud del servidor de métricas
app.get("/api/valeria/health", async (_, res) => {
  try {
    // Verificar conexión a Supabase
    const { data, error } = await supabase.from("tracking_valeria").select("count").limit(1);
    
    if (error) {
      return res.status(500).json({
        ok: false,
        status: "Error de conexión a Supabase",
        error: error.message
      });
    }
    
    res.json({
      ok: true,
      status: "Servidor de métricas funcionando correctamente",
      timestamp: new Date().toISOString(),
      supabase: "Conectado"
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: "Error del servidor de métricas",
      error: String(error)
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("📊 Servidor de métricas de Valeria activo en http://localhost:" + PORT);
  console.log("📈 Endpoints disponibles:");
  console.log("   GET  /api/valeria/rendimiento - Resumen general de rendimiento");
  console.log("   GET  /api/valeria/metricas-diarias - Métricas por día");
  console.log("   GET  /api/valeria/eventos-por-tipo - Eventos agrupados por tipo");
  console.log("   GET  /api/valeria/health - Estado del servidor de métricas");
  console.log("🔗 URL pública: http://localhost:" + PORT + "/api/valeria/rendimiento");
});
