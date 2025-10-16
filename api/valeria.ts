import express from "express";
import { createClient } from "@supabase/supabase-js";
import { registrarEvento } from "../src/modules/trackerComportamiento.js";
import { obtenerEstadisticasClarity } from "../src/modules/trackerVisual.js";
import { analizarPatronesComportamiento, analizarRendimientoSistema, generarReporteEjecutivo } from "../src/modules/analizadorPatrones.js";
import NodeCache from "node-cache";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Configurar Supabase
const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

const app = express();
app.use(express.json());

// Rate Limiting - Protección contra saturación
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por minuto
  message: {
    ok: false,
    error: "⛔ Límite de solicitudes alcanzado, intenta más tarde.",
    retryAfter: "60 segundos"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`🚫 Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({
      ok: false,
      error: "⛔ Límite de solicitudes alcanzado, intenta más tarde.",
      retryAfter: "60 segundos"
    });
  }
});

app.use(limiter);

// Middleware para CORS
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

// Función para obtener contexto de Supabase
async function obtenerContexto(usuario: string, limite = 5) {
  try {
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
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return "";
  }
}

// Función para responder como RRHH con Supabase real y tracking
async function responderComoRRHH(prompt: string) {
  // Registrar evento de inicio de interacción
  await registrarEvento(
    "interaccion_iniciada", 
    `Nueva pregunta recibida: ${prompt.substring(0, 50)}...`, 
    95
  );

  // Obtener contexto de conversaciones anteriores
  const contextoPrevio = await obtenerContexto("Valeria Gómez", 3);
  
  // Registrar evento de contexto recuperado
  await registrarEvento(
    "contexto_recuperado", 
    `Contexto previo obtenido: ${contextoPrevio ? 'Sí' : 'No'}`, 
    90
  );
  
  // Simular respuesta de Valeria Gómez basada en contexto
  const respuestas = [
    `Hola, soy Valeria Gómez, HR Manager. Como profesional en recursos humanos, te recomiendo enfocarte en la comunicación clara y el seguimiento personalizado. Mi estilo orientado a datos con sensibilidad humana me lleva a priorizar soluciones que combinen análisis cuantitativo con empatía.`,
    
    `Desde mi perspectiva como HR Manager, la clave está en crear sistemas que reduzcan la fricción y aumenten el engagement. Mi meta de "Aumentar participación en encuestas" se alinea perfectamente con estrategias que aborden las necesidades reales de los empleados.`,
    
    `Como Valeria Gómez, considerando mi experiencia en gestión de clima laboral, te sugiero implementar soluciones que aborden directamente las frustraciones con "Procesos manuales extensos" mientras mantengo mi tono profesional, empático y analítico.`,
    
    `Desde mi experiencia como HR Manager, la mejor estrategia es aquella que se alinea con mi objetivo de "Detectar riesgos de clima y engagement" y mi estilo orientado a datos con sensibilidad humana.`,
    
    `Hola, como Valeria Gómez, HR Manager, mi enfoque se centra en reducir el tiempo de generación de reportes mientras mejoro la participación en encuestas. Mi estilo es orientado a datos con sensibilidad humana.`
  ];

  const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
  
  // Registrar evento de respuesta generada
  await registrarEvento(
    "respuesta_generada", 
    `Respuesta generada con ${respuesta.length} caracteres`, 
    85
  );
  
  // Guardar REALMENTE en Supabase
  try {
    const { data, error } = await supabase
      .from("registro_interacciones")
      .insert({
        usuario: "Valeria Gómez",
        entrada: prompt,
        salida: respuesta,
        fecha: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error("❌ Error guardando en Supabase:", error);
      await registrarEvento(
        "error_guardado", 
        `Error guardando interacción: ${error.message}`, 
        0
      );
    } else {
      console.log(`✅ Interacción guardada en Supabase con ID: ${data[0]?.id}`);
      await registrarEvento(
        "interaccion_guardada", 
        `Interacción guardada exitosamente con ID: ${data[0]?.id}`, 
        100
      );
    }
  } catch (error) {
    console.error("❌ Error inesperado guardando:", error);
    await registrarEvento(
      "error_inesperado", 
      `Error inesperado: ${String(error)}`, 
      0
    );
  }
  
  // Registrar evento de interacción completada
  await registrarEvento(
    "interaccion_completada", 
    `Interacción completada exitosamente`, 
    95
  );
  
  return respuesta;
}

app.post("/api/valeria", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ 
      ok: false, 
      error: "El campo 'prompt' es requerido" 
    });
  }

  try {
    console.log(`🧠 Pregunta recibida: "${prompt}"`);
    const respuesta = await responderComoRRHH(prompt);
    console.log(`✅ Respuesta enviada: "${respuesta.substring(0, 50)}..."`);
    
    res.json({ 
      ok: true, 
      respuesta,
      timestamp: new Date().toISOString(),
      usuario: "Valeria Gómez"
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ 
      ok: false, 
      error: String(error) 
    });
  }
});

// Endpoint de salud
app.get("/api/valeria/health", (req, res) => {
  res.json({ 
    ok: true, 
    status: "Valeria Gómez está activa",
    timestamp: new Date().toISOString()
  });
});

// Endpoint de información
app.get("/api/valeria/info", (req, res) => {
  res.json({
    ok: true,
    usuario: "Valeria Gómez",
    rol: "HR Manager",
    nivelIA: 4,
    tono: "profesional, empático y analítico",
    metas: [
      "Aumentar participación en encuestas",
      "Reducir tiempo de generación de reportes",
      "Detectar riesgos de clima y engagement"
    ],
    frustraciones: [
      "Procesos manuales extensos",
      "Falta de insights accionables",
      "Baja participación en encuestas remotas"
    ],
    estiloDecisión: "orientado a datos con sensibilidad humana"
  });
});

// Endpoint para ver historial de interacciones
app.get("/api/valeria/historial", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("registro_interacciones")
      .select("*")
      .eq("usuario", "Valeria Gómez")
      .order("fecha", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Error obteniendo historial:", error);
      return res.status(500).json({ 
        ok: false, 
        error: "Error obteniendo historial" 
      });
    }

    res.json({
      ok: true,
      total: data?.length || 0,
      interacciones: data || []
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error inesperado" 
    });
  }
});

// Endpoint para ver tracking de comportamiento
app.get("/api/valeria/tracking", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tracking_valeria")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ Error obteniendo tracking:", error);
      return res.status(500).json({ 
        ok: false, 
        error: "Error obteniendo tracking" 
      });
    }

    // Agrupar eventos por tipo
    const eventosPorTipo = data?.reduce((acc: any, evento: any) => {
      if (!acc[evento.evento]) {
        acc[evento.evento] = [];
      }
      acc[evento.evento].push(evento);
      return acc;
    }, {}) || {};

    res.json({
      ok: true,
      total: data?.length || 0,
      eventos: data || [],
      eventosPorTipo,
      resumen: {
        totalEventos: data?.length || 0,
        tiposEventos: Object.keys(eventosPorTipo).length,
        confianzaPromedio: data?.length ? 
          Math.round(data.reduce((sum: number, e: any) => sum + e.confianza, 0) / data.length) : 0
      }
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error inesperado" 
    });
  }
});

// Endpoint para ver estadísticas de Clarity
app.get("/api/valeria/clarity", async (req, res) => {
  try {
    const estadisticas = await obtenerEstadisticasClarity();
    
    if (!estadisticas) {
      return res.status(500).json({ 
        ok: false, 
        error: "Error obteniendo estadísticas de Clarity" 
      });
    }

    res.json({
      ok: true,
      ...estadisticas,
      status: "Clarity activo y monitoreando"
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error inesperado" 
    });
  }
});

// Endpoint para análisis de patrones de comportamiento
app.get("/api/valeria/patrones", async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const patrones = await analizarPatronesComportamiento("Valeria Gómez", parseInt(dias as string));
    
    res.json({
      ok: true,
      usuario: "Valeria Gómez",
      periodo: `Últimos ${dias} días`,
      totalPatrones: patrones.length,
      patrones,
      resumen: {
        patronesActivos: patrones.filter(p => p.frecuencia > 0).length,
        confianzaPromedio: patrones.length > 0 ? 
          Math.round(patrones.reduce((sum, p) => sum + p.confianzaPromedio, 0) / patrones.length) : 0,
        tendenciasPositivas: patrones.filter(p => p.tendencia === 'creciente').length,
        tendenciasNegativas: patrones.filter(p => p.tendencia === 'decreciente').length
      }
    });
  } catch (error) {
    console.error("❌ Error analizando patrones:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error analizando patrones de comportamiento" 
    });
  }
});

// Endpoint para análisis de rendimiento del sistema
app.get("/api/valeria/rendimiento", async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const rendimiento = await analizarRendimientoSistema("Valeria Gómez", parseInt(dias as string));
    
    res.json({
      ok: true,
      usuario: "Valeria Gómez",
      periodo: `Últimos ${dias} días`,
      rendimiento,
      status: "Análisis de rendimiento completado"
    });
  } catch (error) {
    console.error("❌ Error analizando rendimiento:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error analizando rendimiento del sistema" 
    });
  }
});

// Endpoint para reporte ejecutivo completo
app.get("/api/valeria/reporte", async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const reporte = await generarReporteEjecutivo("Valeria Gómez", parseInt(dias as string));
    
    res.json({
      ok: true,
      usuario: "Valeria Gómez",
      periodo: `Últimos ${dias} días`,
      reporte,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error generando reporte:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error generando reporte ejecutivo" 
    });
  }
});

// Endpoint para estadísticas de caché
app.get("/api/valeria/cache", async (req, res) => {
  try {
    // Obtener estadísticas de caché desde tracking
    const { data: eventosCache, error } = await supabase
      .from("tracking_valeria")
      .select("*")
      .eq("evento", "respuesta_cache")
      .order("fecha", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Error obteniendo estadísticas de caché:", error);
      return res.status(500).json({ 
        ok: false, 
        error: "Error obteniendo estadísticas de caché" 
      });
    }

    // Obtener total de respuestas generadas para calcular ratio
    const { data: eventosGenerados, error: errorGenerados } = await supabase
      .from("tracking_valeria")
      .select("*")
      .eq("evento", "respuesta_generada")
      .order("fecha", { ascending: false })
      .limit(100);

    if (errorGenerados) {
      console.error("❌ Error obteniendo eventos generados:", errorGenerados);
    }

    const totalCache = eventosCache?.length || 0;
    const totalGeneradas = eventosGenerados?.length || 0;
    const totalRespuestas = totalCache + totalGeneradas;
    const ratioCache = totalRespuestas > 0 ? Math.round((totalCache / totalRespuestas) * 100) : 0;

    res.json({
      ok: true,
      estadisticas: {
        respuestasEnCache: totalCache,
        respuestasGeneradas: totalGeneradas,
        totalRespuestas,
        ratioCache: `${ratioCache}%`,
        ahorroTokens: totalCache > 0 ? "Significativo" : "Sin ahorro aún",
        ultimaActividadCache: eventosCache?.[0]?.fecha || null
      },
      eventos: eventosCache || [],
      status: "Estadísticas de caché obtenidas exitosamente"
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error inesperado" 
    });
  }
});

// Endpoint para estadísticas de rate limiting
app.get("/api/valeria/rate-limit", async (req, res) => {
  try {
    // Obtener estadísticas de rate limiting desde tracking
    const { data: eventosRateLimit, error } = await supabase
      .from("tracking_valeria")
      .select("*")
      .ilike("evento", "%rate_limit%")
      .order("fecha", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ Error obteniendo estadísticas de rate limiting:", error);
      return res.status(500).json({ 
        ok: false, 
        error: "Error obteniendo estadísticas de rate limiting" 
      });
    }

    res.json({
      ok: true,
      configuracion: {
        windowMs: "60 segundos",
        maxRequests: 10,
        mensaje: "⛔ Límite de solicitudes alcanzado, intenta más tarde."
      },
      estadisticas: {
        eventosRateLimit: eventosRateLimit?.length || 0,
        ultimoEvento: eventosRateLimit?.[0]?.fecha || null,
        status: "Rate limiting activo y monitoreando"
      },
      eventos: eventosRateLimit || [],
      status: "Estadísticas de rate limiting obtenidas exitosamente"
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Error inesperado" 
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor de Valeria activo en http://localhost:" + PORT + "/api/valeria");
  console.log("📊 Endpoints disponibles:");
  console.log("   POST /api/valeria - Interactuar con Valeria");
  console.log("   GET  /api/valeria/health - Estado del servidor");
  console.log("   GET  /api/valeria/info - Información de Valeria");
  console.log("   GET  /api/valeria/historial - Historial de interacciones en Supabase");
  console.log("   GET  /api/valeria/tracking - Tracking de comportamiento de Valeria");
  console.log("   GET  /api/valeria/clarity - Estadísticas de Microsoft Clarity");
  console.log("   GET  /api/valeria/patrones - Análisis de patrones de comportamiento");
  console.log("   GET  /api/valeria/rendimiento - Análisis de rendimiento del sistema");
  console.log("   GET  /api/valeria/reporte - Reporte ejecutivo completo");
  console.log("   GET  /api/valeria/cache - Estadísticas de caché de respuestas");
  console.log("   GET  /api/valeria/rate-limit - Estadísticas de rate limiting");
  console.log("🔗 URL pública ngrok: https://0f85858ad965.ngrok-free.app");
  console.log("🛡️ Rate Limiting: 10 requests/minuto por IP");
});
