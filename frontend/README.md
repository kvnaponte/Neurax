# Sistema Imbatible - Frontend

RPG de la vida real para optimizar comportamiento y productividad.

## 🚀 Características

- **Dashboard Interactivo**: Visualiza tu progreso en tiempo real
- **Registro de Actividades**: Sigue tus actividades diarias (sueño, ejercicio, estudio, trabajo, etc.)
- **Sistema de Hitos**: Celebra tus logros con hitos especiales
- **Racha de Días**: Mantén tu motivación con un sistema de rachas
- **Niveles RPG**: Progresa desde "Superviviente" hasta "Imbatible"
- **Interfaz Responsiva**: Funciona perfectamente en móvil, tablet y desktop

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🔧 Instalación

1. Navega a la carpeta del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env.local` (copia de `.env.example`):
```bash
VITE_API_URL=http://localhost:1104/api
```

## 🎮 Uso

### Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

### Build para producción
```bash
npm run build
```

### Preview de producción
```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── pages/           # Páginas principales
│   │   ├── Login.svelte
│   │   ├── Dashboard.svelte
│   │   ├── Actividades.svelte
│   │   ├── Hitos.svelte
│   │   └── Perfil.svelte
│   ├── lib/
│   │   ├── components/  # Componentes reutilizables
│   │   │   ├── Navbar.svelte
│   │   │   ├── XPCard.svelte
│   │   │   ├── StreakCard.svelte
│   │   │   └── ActividadForm.svelte
│   │   └── services/    # Servicios API
│   │       └── api.ts
│   ├── App.svelte       # Componente raíz
│   ├── main.ts          # Punto de entrada
│   └── app.css          # Estilos globales
├── static/              # Archivos estáticos
├── index.html           # HTML base
└── package.json         # Dependencias del proyecto
```

## 🎨 Temas y Personalización

El sistema usa variables CSS para los colores y estilos. Puedes personalizarlos en `src/app.css`:

```css
:root {
    --color-primary: #6366f1;
    --color-secondary: #8b5cf6;
    --color-accent: #ec4899;
    /* ... más variables ... */
}
```

## 🔌 API Integration

El frontend se conecta con el backend FastAPI en:
```
http://localhost:1104/api
```

### Endpoints disponibles:

- `POST /usuarios` - Crear usuario
- `GET /usuarios/{id}` - Obtener usuario
- `PATCH /usuarios/{id}/desactivar` - Desactivar usuario
- `POST /usuarios/{id}/actividades` - Registrar actividad
- `GET /usuarios/{id}/actividades` - Obtener actividades
- `POST /usuarios/{id}/hitos` - Registrar hito
- `GET /usuarios/{id}/hitos` - Obtener hitos
- `GET /usuarios/{id}/estadisticas` - Obtener estadísticas

## 🛠️ Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run preview` - Vista previa del build
- `npm run check` - Verificación de tipos TypeScript
- `npm run check:watch` - Verificación en tiempo real
- `npm run lint` - Verificar estilo de código
- `npm run format` - Formatear código

## 🎯 Flujo de la Aplicación

1. **Login**: El usuario se registra o inicia sesión con su nombre y email
2. **Dashboard**: Visualiza su progreso, XP, nivel y racha
3. **Registrar Actividades**: Puede registrar nuevas actividades desde el dashboard o la página dedicada
4. **Ver Historial**: Visualiza todas sus actividades en la página de Actividades
5. **Hitos**: Celebra logros especiales con el sistema de hitos
6. **Perfil**: Visualiza sus estadísticas completas y gestiona su cuenta

## 🎨 Diseño

- **Tema Oscuro**: Interfaz optimizada para reducir fatiga visual
- **Gradientes**: Uso de gradientes para elementos clave (botones, títulos)
- **Iconografía**: Emojis para una experiencia más lúdica
- **Responsividad**: Grid system que se adapta a cualquier tamaño de pantalla

## 🔐 Seguridad

- Token almacenado en localStorage (considera usar httpOnly cookies en producción)
- Validación en cliente con Pydantic/TypeScript
- CORS configurado en el backend

## 📱 Compatibilidad

- ✅ Chrome/Edge (últimas versiones)
- ✅ Firefox (últimas versiones)
- ✅ Safari (últimas versiones)
- ✅ Mobile browsers

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📄 Licencia

Este proyecto es parte de Sistema Imbatible.
