-- Crear vista de resumen de rendimiento de Valeria
CREATE OR REPLACE VIEW resumen_valeria AS
SELECT 
  'Valeria Gómez' as usuario,
  COUNT(*) as total_interacciones,
  ROUND(AVG(
    CASE 
      WHEN evento = 'respuesta_generada' THEN confianza
      ELSE NULL 
    END
  ), 2) as confianza_promedio,
  MAX(fecha) as ultima_interaccion,
  COUNT(CASE WHEN evento = 'respuesta_cache' THEN 1 END) as respuestas_cache,
  COUNT(CASE WHEN evento = 'respuesta_generada' THEN 1 END) as respuestas_generadas,
  ROUND(
    (COUNT(CASE WHEN evento = 'respuesta_cache' THEN 1 END)::float / 
     NULLIF(COUNT(CASE WHEN evento IN ('respuesta_cache', 'respuesta_generada') THEN 1 END), 0)) * 100, 
    2
  ) as ratio_cache_porcentaje
FROM tracking_valeria
WHERE fecha >= NOW() - INTERVAL '7 days';

-- Crear vista de métricas por día
CREATE OR REPLACE VIEW metricas_diarias_valeria AS
SELECT 
  DATE(fecha) as fecha,
  COUNT(*) as total_eventos,
  COUNT(CASE WHEN evento = 'interaccion_iniciada' THEN 1 END) as interacciones_iniciadas,
  COUNT(CASE WHEN evento = 'respuesta_generada' THEN 1 END) as respuestas_generadas,
  COUNT(CASE WHEN evento = 'respuesta_cache' THEN 1 END) as respuestas_cache,
  ROUND(AVG(confianza), 2) as confianza_promedio
FROM tracking_valeria
WHERE fecha >= NOW() - INTERVAL '30 days'
GROUP BY DATE(fecha)
ORDER BY fecha DESC;

-- Crear vista de eventos por tipo
CREATE OR REPLACE VIEW eventos_por_tipo_valeria AS
SELECT 
  evento,
  COUNT(*) as frecuencia,
  ROUND(AVG(confianza), 2) as confianza_promedio,
  MIN(fecha) as primera_ocurrencia,
  MAX(fecha) as ultima_ocurrencia
FROM tracking_valeria
WHERE fecha >= NOW() - INTERVAL '7 days'
GROUP BY evento
ORDER BY frecuencia DESC;
