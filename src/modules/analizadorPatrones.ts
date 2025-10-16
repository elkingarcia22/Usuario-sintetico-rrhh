import { createClient } from "@supabase/supabase-js";

// Función para obtener cliente de Supabase
function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

// Interfaz para patrones de comportamiento
interface PatronComportamiento {
  tipo: string;
  frecuencia: number;
  confianzaPromedio: number;
  tendencia: 'creciente' | 'decreciente' | 'estable';
  ultimaActividad: Date;
  insights: string[];
}

// Interfaz para análisis de rendimiento
interface AnalisisRendimiento {
  tiempoPromedioRespuesta: number;
  tasaExito: number;
  patronesTemporales: {
    horaPico: number;
    diaPico: string;
    actividadSemanal: Record<string, number>;
  };
  metricasCalidad: {
    confianzaPromedio: number;
    satisfaccionEstimada: number;
    coherenciaRespuestas: number;
  };
}

// Función para analizar patrones de comportamiento
export async function analizarPatronesComportamiento(usuario: string, dias = 7): Promise<PatronComportamiento[]> {
  try {
    const supabase = getSupabaseClient();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    // Obtener eventos de tracking
    const { data: eventos, error } = await supabase
      .from("tracking_valeria")
      .select("*")
      .gte("fecha", fechaInicio.toISOString())
      .order("fecha", { ascending: false });

    if (error) {
      console.error("❌ Error obteniendo eventos:", error);
      return [];
    }

    // Obtener interacciones
    const { data: interacciones, error: errorInteracciones } = await supabase
      .from("registro_interacciones")
      .select("*")
      .eq("usuario", usuario)
      .gte("fecha", fechaInicio.toISOString())
      .order("fecha", { ascending: false });

    if (errorInteracciones) {
      console.error("❌ Error obteniendo interacciones:", errorInteracciones);
    }

    // Analizar patrones
    const patrones: PatronComportamiento[] = [];
    
    // Agrupar eventos por tipo
    const eventosPorTipo = eventos?.reduce((acc: any, evento: any) => {
      if (!acc[evento.evento]) {
        acc[evento.evento] = [];
      }
      acc[evento.evento].push(evento);
      return acc;
    }, {}) || {};

    // Crear patrones para cada tipo de evento
    Object.entries(eventosPorTipo).forEach(([tipo, eventosTipo]: [string, any]) => {
      const eventosArray = eventosTipo as any[];
      const confianzaPromedio = eventosArray.reduce((sum, e) => sum + e.confianza, 0) / eventosArray.length;
      const ultimaActividad = new Date(Math.max(...eventosArray.map((e: any) => new Date(e.fecha).getTime())));
      
      // Calcular tendencia (simplificado)
      const mitad = Math.floor(eventosArray.length / 2);
      const primeraMitad = eventosArray.slice(0, mitad);
      const segundaMitad = eventosArray.slice(mitad);
      const confianzaPrimera = primeraMitad.reduce((sum, e) => sum + e.confianza, 0) / primeraMitad.length;
      const confianzaSegunda = segundaMitad.reduce((sum, e) => sum + e.confianza, 0) / segundaMitad.length;
      
      let tendencia: 'creciente' | 'decreciente' | 'estable' = 'estable';
      if (confianzaSegunda > confianzaPrimera + 5) tendencia = 'creciente';
      else if (confianzaSegunda < confianzaPrimera - 5) tendencia = 'decreciente';

      // Generar insights
      const insights = generarInsights(tipo, eventosArray.length, confianzaPromedio, tendencia);

      patrones.push({
        tipo,
        frecuencia: eventosArray.length,
        confianzaPromedio: Math.round(confianzaPromedio),
        tendencia,
        ultimaActividad,
        insights
      });
    });

    return patrones.sort((a, b) => b.frecuencia - a.frecuencia);
  } catch (error) {
    console.error("❌ Error analizando patrones:", error);
    return [];
  }
}

// Función para analizar rendimiento del sistema
export async function analizarRendimientoSistema(usuario: string, dias = 7): Promise<AnalisisRendimiento> {
  try {
    const supabase = getSupabaseClient();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    // Obtener interacciones
    const { data: interacciones, error } = await supabase
      .from("registro_interacciones")
      .select("*")
      .eq("usuario", usuario)
      .gte("fecha", fechaInicio.toISOString())
      .order("fecha", { ascending: false });

    if (error) {
      console.error("❌ Error obteniendo interacciones:", error);
      return getAnalisisDefault();
    }

    // Obtener eventos de tracking
    const { data: eventos, error: errorEventos } = await supabase
      .from("tracking_valeria")
      .select("*")
      .gte("fecha", fechaInicio.toISOString())
      .order("fecha", { ascending: false });

    if (errorEventos) {
      console.error("❌ Error obteniendo eventos:", errorEventos);
    }

    // Calcular métricas
    const tiempoPromedioRespuesta = calcularTiempoPromedioRespuesta(eventos || []);
    const tasaExito = calcularTasaExito(eventos || []);
    const patronesTemporales = analizarPatronesTemporales(interacciones || []);
    const metricasCalidad = calcularMetricasCalidad(eventos || []);

    return {
      tiempoPromedioRespuesta,
      tasaExito,
      patronesTemporales,
      metricasCalidad
    };
  } catch (error) {
    console.error("❌ Error analizando rendimiento:", error);
    return getAnalisisDefault();
  }
}

// Función para generar insights automáticos
function generarInsights(tipo: string, frecuencia: number, confianza: number, tendencia: string): string[] {
  const insights: string[] = [];

  // Insights basados en frecuencia
  if (frecuencia > 50) {
    insights.push(`Alta actividad: ${frecuencia} eventos en los últimos 7 días`);
  } else if (frecuencia < 10) {
    insights.push(`Baja actividad: Solo ${frecuencia} eventos recientes`);
  }

  // Insights basados en confianza
  if (confianza > 90) {
    insights.push(`Excelente confianza: ${Math.round(confianza)}% promedio`);
  } else if (confianza < 70) {
    insights.push(`Confianza baja: ${Math.round(confianza)}% - requiere atención`);
  }

  // Insights basados en tendencia
  if (tendencia === 'creciente') {
    insights.push(`Tendencia positiva: Mejora en confianza`);
  } else if (tendencia === 'decreciente') {
    insights.push(`Tendencia negativa: Disminución en confianza`);
  }

  // Insights específicos por tipo
  switch (tipo) {
    case 'interaccion_iniciada':
      insights.push(`Valeria procesa ${frecuencia} consultas activamente`);
      break;
    case 'respuesta_generada':
      insights.push(`Generación de respuestas: ${frecuencia} respuestas producidas`);
      break;
    case 'contexto_recuperado':
      insights.push(`Memoria contextual: ${frecuencia} recuperaciones exitosas`);
      break;
  }

  return insights;
}

// Función para calcular tiempo promedio de respuesta
function calcularTiempoPromedioRespuesta(eventos: any[]): number {
  const eventosInicio = eventos.filter(e => e.evento === 'interaccion_iniciada');
  const eventosFin = eventos.filter(e => e.evento === 'interaccion_completada');
  
  let tiempoTotal = 0;
  let contador = 0;

  eventosInicio.forEach(inicio => {
    const fin = eventosFin.find(f => 
      new Date(f.fecha).getTime() > new Date(inicio.fecha).getTime()
    );
    
    if (fin) {
      const tiempo = new Date(fin.fecha).getTime() - new Date(inicio.fecha).getTime();
      tiempoTotal += tiempo;
      contador++;
    }
  });

  return contador > 0 ? Math.round(tiempoTotal / contador / 1000) : 0; // en segundos
}

// Función para calcular tasa de éxito
function calcularTasaExito(eventos: any[]): number {
  const eventosCompletados = eventos.filter(e => e.evento === 'interaccion_completada').length;
  const eventosIniciados = eventos.filter(e => e.evento === 'interaccion_iniciada').length;
  
  return eventosIniciados > 0 ? Math.round((eventosCompletados / eventosIniciados) * 100) : 0;
}

// Función para analizar patrones temporales
function analizarPatronesTemporales(interacciones: any[]): any {
  const actividadPorHora: Record<number, number> = {};
  const actividadPorDia: Record<string, number> = {};
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  interacciones.forEach(interaccion => {
    const fecha = new Date(interaccion.fecha);
    const hora = fecha.getHours();
    const dia = diasSemana[fecha.getDay()];

    actividadPorHora[hora] = (actividadPorHora[hora] || 0) + 1;
    actividadPorDia[dia] = (actividadPorDia[dia] || 0) + 1;
  });

  const horaPico = Object.entries(actividadPorHora).reduce((a, b) => 
    actividadPorHora[parseInt(a[0])] > actividadPorHora[parseInt(b[0])] ? a : b
  )[0];

  const diaPico = Object.entries(actividadPorDia).reduce((a, b) => 
    actividadPorDia[a[0]] > actividadPorDia[b[0]] ? a : b
  )[0];

  return {
    horaPico: parseInt(horaPico),
    diaPico,
    actividadSemanal: actividadPorDia
  };
}

// Función para calcular métricas de calidad
function calcularMetricasCalidad(eventos: any[]): any {
  const confianzaPromedio = eventos.length > 0 ? 
    eventos.reduce((sum, e) => sum + e.confianza, 0) / eventos.length : 0;

  // Simular satisfacción basada en confianza
  const satisfaccionEstimada = Math.min(100, confianzaPromedio + 10);

  // Calcular coherencia (simplificado)
  const eventosRespuesta = eventos.filter(e => e.evento === 'respuesta_generada');
  const coherenciaRespuestas = eventosRespuesta.length > 0 ? 
    Math.round(confianzaPromedio * 0.9) : 0;

  return {
    confianzaPromedio: Math.round(confianzaPromedio),
    satisfaccionEstimada: Math.round(satisfaccionEstimada),
    coherenciaRespuestas
  };
}

// Función para obtener análisis por defecto
function getAnalisisDefault(): AnalisisRendimiento {
  return {
    tiempoPromedioRespuesta: 0,
    tasaExito: 0,
    patronesTemporales: {
      horaPico: 0,
      diaPico: 'Lunes',
      actividadSemanal: {}
    },
    metricasCalidad: {
      confianzaPromedio: 0,
      satisfaccionEstimada: 0,
      coherenciaRespuestas: 0
    }
  };
}

// Función para generar reporte ejecutivo
export async function generarReporteEjecutivo(usuario: string, dias = 7): Promise<string> {
  const patrones = await analizarPatronesComportamiento(usuario, dias);
  const rendimiento = await analizarRendimientoSistema(usuario, dias);

  const reporte = `
📊 REPORTE EJECUTIVO - USUARIO SINTÉTICO RRHH
===============================================

👤 Usuario: ${usuario}
📅 Período: Últimos ${dias} días
🕐 Generado: ${new Date().toLocaleString()}

🎯 MÉTRICAS DE RENDIMIENTO
--------------------------
⏱️  Tiempo promedio de respuesta: ${rendimiento.tiempoPromedioRespuesta}s
✅ Tasa de éxito: ${rendimiento.tasaExito}%
📈 Confianza promedio: ${rendimiento.metricasCalidad.confianzaPromedio}%
😊 Satisfacción estimada: ${rendimiento.metricasCalidad.satisfaccionEstimada}%
🧠 Coherencia de respuestas: ${rendimiento.metricasCalidad.coherenciaRespuestas}%

⏰ PATRONES TEMPORALES
----------------------
🕐 Hora pico de actividad: ${rendimiento.patronesTemporales.horaPico}:00
📅 Día más activo: ${rendimiento.patronesTemporales.diaPico}

📊 PATRONES DE COMPORTAMIENTO
-----------------------------
${patrones.map(p => `
🔹 ${p.tipo.toUpperCase()}
   Frecuencia: ${p.frecuencia} eventos
   Confianza: ${p.confianzaPromedio}%
   Tendencia: ${p.tendencia}
   Insights: ${p.insights.join(', ')}
`).join('')}

💡 RECOMENDACIONES
------------------
${generarRecomendaciones(patrones, rendimiento)}
`;

  return reporte;
}

// Función para generar recomendaciones
function generarRecomendaciones(patrones: PatronComportamiento[], rendimiento: AnalisisRendimiento): string {
  const recomendaciones: string[] = [];

  // Recomendaciones basadas en rendimiento
  if (rendimiento.tiempoPromedioRespuesta > 5) {
    recomendaciones.push("⚡ Optimizar tiempo de respuesta - considerar cache de respuestas frecuentes");
  }

  if (rendimiento.tasaExito < 90) {
    recomendaciones.push("🔧 Revisar fallos en interacciones - mejorar manejo de errores");
  }

  if (rendimiento.metricasCalidad.confianzaPromedio < 80) {
    recomendaciones.push("📚 Mejorar calidad de respuestas - entrenar con más contexto");
  }

  // Recomendaciones basadas en patrones
  const patronesBajaConfianza = patrones.filter(p => p.confianzaPromedio < 70);
  if (patronesBajaConfianza.length > 0) {
    recomendaciones.push(`🎯 Revisar patrones de baja confianza: ${patronesBajaConfianza.map(p => p.tipo).join(', ')}`);
  }

  const patronesDecrecientes = patrones.filter(p => p.tendencia === 'decreciente');
  if (patronesDecrecientes.length > 0) {
    recomendaciones.push(`📉 Atender tendencias decrecientes: ${patronesDecrecientes.map(p => p.tipo).join(', ')}`);
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push("✅ Sistema funcionando óptimamente - mantener monitoreo continuo");
  }

  return recomendaciones.join('\n');
}
