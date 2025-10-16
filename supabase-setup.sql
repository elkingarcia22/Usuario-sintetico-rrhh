-- Configuración de Supabase para Usuario Sintético RRHH
-- Ejecuta este SQL en tu dashboard de Supabase

-- Crear tabla para registro de interacciones
CREATE TABLE IF NOT EXISTS registro_interacciones (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(100) NOT NULL,
  entrada TEXT NOT NULL,
  salida TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear tabla para perfiles de usuarios sintéticos
CREATE TABLE IF NOT EXISTS perfiles_usuarios_sinteticos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  rol VARCHAR(100) NOT NULL,
  nivel_ia INTEGER NOT NULL,
  tono TEXT NOT NULL,
  metas TEXT[] NOT NULL,
  frustraciones TEXT[] NOT NULL,
  estilo_decision TEXT NOT NULL,
  configuracion JSONB DEFAULT '{}'::jsonb,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar el perfil de Valeria Gómez
INSERT INTO perfiles_usuarios_sinteticos (
  nombre, 
  rol, 
  nivel_ia, 
  tono, 
  metas, 
  frustraciones, 
  estilo_decision
) VALUES (
  'Valeria Gómez',
  'HR Manager',
  4,
  'profesional, empático y analítico',
  ARRAY[
    'Aumentar participación en encuestas',
    'Reducir tiempo de generación de reportes',
    'Detectar riesgos de clima y engagement'
  ],
  ARRAY[
    'Procesos manuales extensos',
    'Falta de insights accionables',
    'Baja participación en encuestas remotas'
  ],
  'orientado a datos con sensibilidad humana'
) ON CONFLICT DO NOTHING;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_registro_interacciones_usuario ON registro_interacciones(usuario);
CREATE INDEX IF NOT EXISTS idx_registro_interacciones_fecha ON registro_interacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_perfiles_activos ON perfiles_usuarios_sinteticos(activo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE registro_interacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_usuarios_sinteticos ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (ajusta según tus necesidades)
CREATE POLICY "Permitir lectura pública" ON registro_interacciones FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública" ON registro_interacciones FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura pública perfiles" ON perfiles_usuarios_sinteticos FOR SELECT USING (activo = true);
