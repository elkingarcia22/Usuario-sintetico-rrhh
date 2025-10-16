import express from "express";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json());

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

// Función para responder como RRHH (versión simplificada)
async function responderComoRRHH(prompt: string) {
  // Simular respuesta de Valeria Gómez
  const respuestas = [
    `Hola, soy Valeria Gómez, HR Manager. Como profesional en recursos humanos, te recomiendo enfocarte en la comunicación clara y el seguimiento personalizado. Mi estilo orientado a datos con sensibilidad humana me lleva a priorizar soluciones que combinen análisis cuantitativo con empatía.`,
    
    `Desde mi perspectiva como HR Manager, la clave está en crear sistemas que reduzcan la fricción y aumenten el engagement. Mi meta de "Aumentar participación en encuestas" se alinea perfectamente con estrategias que aborden las necesidades reales de los empleados.`,
    
    `Como Valeria Gómez, considerando mi experiencia en gestión de clima laboral, te sugiero implementar soluciones que aborden directamente las frustraciones con "Procesos manuales extensos" mientras mantengo mi tono profesional, empático y analítico.`,
    
    `Desde mi experiencia como HR Manager, la mejor estrategia es aquella que se alinea con mi objetivo de "Detectar riesgos de clima y engagement" y mi estilo orientado a datos con sensibilidad humana.`,
    
    `Hola, como Valeria Gómez, HR Manager, mi enfoque se centra en reducir el tiempo de generación de reportes mientras mejoro la participación en encuestas. Mi estilo es orientado a datos con sensibilidad humana.`
  ];

  const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
  
  // Simular guardado en Supabase (opcional)
  console.log(`📝 Interacción guardada: "${prompt}" -> "${respuesta.substring(0, 50)}..."`);
  
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor de Valeria activo en http://localhost:" + PORT + "/api/valeria");
  console.log("📊 Endpoints disponibles:");
  console.log("   POST /api/valeria - Interactuar con Valeria");
  console.log("   GET  /api/valeria/health - Estado del servidor");
  console.log("   GET  /api/valeria/info - Información de Valeria");
});
