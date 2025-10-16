import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

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

// Endpoint de métricas diarias
app.get("/api/valeria/metricas-diarias", async (_, res) => {
  try {
    const { data, error } = await supabase.from("metricas_diarias_valeria").select("*");
    if (error) {
      console.error("❌ Error obteniendo métricas diarias:", error);
      return res.status(500).json({ 
        ok: false,
        error: error.message 
      });
    }
    
    res.json({
      ok: true,
      data: data || [],
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

// Endpoint de eventos por tipo
app.get("/api/valeria/eventos-por-tipo", async (_, res) => {
  try {
    const { data, error } = await supabase.from("eventos_por_tipo_valeria").select("*");
    if (error) {
      console.error("❌ Error obteniendo eventos por tipo:", error);
      return res.status(500).json({ 
        ok: false,
        error: error.message 
      });
    }
    
    res.json({
      ok: true,
      data: data || [],
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
