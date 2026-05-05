# Sistema Imbatible - Frontend

## 🚀 Inicio Rápido

El frontend está disponible en dos versiones:

### Opción 1: HTML Estático (Recomendado para desarrollo rápido)

```bash
# Sirve el archivo HTML directo
cd frontend/dist
python3 -m http.server 8000

# O con Node.js
npx http-server .
```

Luego abre: `http://localhost:8000`

### Opción 2: Svelte + Vite (Desarrollo completo)

```bash
cd frontend
npm install
npm run dev
```

Estará disponible en: `http://localhost:5173`

## 📁 Estructura

```
frontend/
├── dist/
│   └── index.html          # Versión HTML estática (funciona sin build)
├── src/                    # Código fuente Svelte (para desarrollo)
│   ├── pages/
│   ├── lib/
│   └── App.svelte
├── package.json
└── vite.config.ts
```

## ✨ Características

✅ **Login/Registro**: Crear usuario con nombre y email
✅ **Dashboard**: Ver progreso, XP, nivel y racha
✅ **Registro de Actividades**: Sueño, ejercicio, estudio, trabajo, etc.
✅ **Tema Oscuro**: Interfaz optimizada
✅ **Responsive**: Funciona en móvil y desktop

## 🔌 Conexión con Backend

El frontend se conecta automáticamente a:
```
http://localhost:1104/api
```

Asegúrate de que el backend esté corriendo:
```bash
cd app
python3 -m uvicorn main:app --host 0.0.0.0 --port 1104
```

## 📱 Uso

1. **Abre** el frontend en el navegador
2. **Regístrate** con tu nombre y email
3. **Registro de actividades**: Selecciona tipo y duración
4. **Ver progreso**: El XP se actualiza automáticamente

## 🛠️ Desarrollo con Svelte

Si quieres modificar el frontend con Svelte:

```bash
npm install
npm run dev
```

El hot reload estará habilitado para cambios instantáneos.

## 📊 API Endpoints Utilizados

- `POST /api/usuarios` - Crear usuario
- `GET /api/usuarios/{id}` - Obtener información del usuario
- `POST /api/usuarios/{id}/actividades` - Registrar actividad
- `GET /api/usuarios/{id}/actividades` - Obtener historial
- `POST /api/usuarios/{id}/hitos` - Registrar hito
- `GET /api/usuarios/{id}/estadisticas` - Obtener estadísticas

## 🎯 Próximas Mejoras

- [ ] Página completa de Actividades con historial
- [ ] Sistema de Hitos con formulario
- [ ] Página de Perfil
- [ ] Gráficas de progreso
- [ ] Modo oscuro/claro toggle
- [ ] Integración con notificaciones

## 🐛 Solución de Problemas

**Error: "Cannot connect to API"**
- Verifica que el backend esté corriendo en `http://localhost:1104`
- Revisa la consola del navegador (F12) para más detalles

**El HTML no muestra estilos**
- Asegúrate de usar `http://localhost:8000` y no `file://`
- Algunos navegadores no permiten JavaScript en URLs `file://`
