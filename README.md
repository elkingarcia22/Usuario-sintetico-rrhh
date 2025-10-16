# Usuario Sintético RRHH 🤖

Un sistema de IA avanzado que simula usuarios de Recursos Humanos para mejorar la gestión de clima laboral, encuestas y cultura organizacional.

## 🎯 Características

- **Arquetipo de Usuario Sintético**: Valeria Gómez, HR Manager profesional
- **Memoria Contextual**: Integración con Supabase para persistencia de datos
- **IA Avanzada**: Compatible con Google Gemini y OpenAI
- **Simulación de Interfaz**: Playwright para automatización de navegadores
- **Análisis de Datos**: Métricas y insights accionables

## 🧠 Personalidad del Usuario Sintético

### Valeria Gómez - HR Manager
- **Nivel IA**: 4 (Semi-independiente)
- **Tono**: Profesional, empático y analítico
- **Estilo de Decisión**: Orientado a datos con sensibilidad humana

### Metas Profesionales
- Aumentar participación en encuestas
- Reducir tiempo de generación de reportes
- Detectar riesgos de clima y engagement

### Frustraciones
- Procesos manuales extensos
- Falta de insights accionables
- Baja participación en encuestas remotas

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/elkingarcia22/Usuario-sintetico-rrhh.git
cd Usuario-sintetico-rrhh
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env.local`:
```bash
# Google Gemini AI
GEMINI_API_KEY=tu_clave_de_gemini_aqui

# Supabase Configuration
SUPABASE_URL=tu_url_de_supabase_aqui
SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase_aqui

# OpenAI (opcional)
OPENAI_API_KEY=tu_openai_api_key_aqui
```

4. **Configurar Supabase**
Ejecutar el SQL en tu dashboard de Supabase:
```sql
CREATE TABLE IF NOT EXISTS registro_interacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT,
  entrada TEXT,
  salida TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW()
);
```

## 🧪 Uso

### Ejecutar Demo
```bash
npx tsx test-demo.ts
```

### Usar el Agente
```typescript
import { responderComoRRHH } from "./src/agents/usuarioSinteticoRRHH.js";

const respuesta = await responderComoRRHH(
  "¿Cómo puedo aumentar la participación en encuestas de clima?"
);
console.log(respuesta);
```

## 📁 Estructura del Proyecto

```
usuario-sintetico-rrhh/
├── src/
│   ├── agents/           # Agentes de IA
│   │   └── usuarioSinteticoRRHH.ts
│   ├── config/           # Configuraciones
│   │   ├── gemini.ts
│   │   └── supabase.ts
│   ├── modules/          # Módulos del sistema
│   └── data/            # Datos y archivos
├── .env.local           # Variables de entorno
├── package.json
└── README.md
```

## 🛠️ Tecnologías

- **Node.js** - Runtime de JavaScript
- **TypeScript** - Tipado estático
- **Google Gemini AI** - Motor de IA
- **Supabase** - Base de datos y autenticación
- **Playwright** - Automatización de navegadores
- **Axios** - Cliente HTTP

## 📊 Funcionalidades

- ✅ Arquetipo de usuario sintético implementado
- ✅ Memoria contextual en Supabase
- ✅ Integración con IA (Gemini/OpenAI)
- ✅ Sistema de interacciones persistente
- ✅ Configuración modular y escalable

## 🔮 Próximas Funcionalidades

- [ ] Dashboard de métricas
- [ ] Múltiples arquetipos de usuario
- [ ] Integración con n8n
- [ ] Análisis de sentimientos
- [ ] Reportes automáticos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Elkin Garcia** - [@elkingarcia22](https://github.com/elkingarcia22)

---

⭐ Si este proyecto te ayuda, ¡dale una estrella!
