# Integración de PRUEBA a Svelte

Los componentes de la carpeta PRUEBA han sido portados a Svelte:

## Componentes Disponibles

### 1. AndroidDevice
Frame de dispositivo Android con Material Design 3.

```svelte
<script>
  import AndroidDevice from '$lib/components/AndroidDevice.svelte';
</script>

<AndroidDevice width={412} height={892} dark={false} title="Mi App" large={false} keyboard={false}>
  <div>Contenido aquí</div>
</AndroidDevice>
```

**Props:**
- `width` (number): Ancho en píxeles (default: 412)
- `height` (number): Alto en píxeles (default: 892)
- `dark` (boolean): Tema oscuro (default: false)
- `title` (string|undefined): Título del app bar
- `large` (boolean): App bar grande (default: false)
- `keyboard` (boolean): Mostrar teclado (default: false)

---

### 2. TweaksPanel
Panel flotante para ajustar valores dinámicamente (like Figma tweaks).

```svelte
<script>
  import TweaksPanel from '$lib/components/TweaksPanel.svelte';
  import { TweakSlider, TweakToggle, TweakColor } from '$lib/components/tweaks';
  
  let tweaks = {
    fontSize: 16,
    darkMode: false,
    primaryColor: '#6366f1'
  };
</script>

<TweaksPanel title="Tweaks">
  <TweakSlider 
    label="Font size"
    value={tweaks.fontSize}
    min={10}
    max={32}
    unit="px"
    onChange={(v) => tweaks.fontSize = v}
  />
  
  <TweakToggle 
    label="Dark mode"
    value={tweaks.darkMode}
    onChange={(v) => tweaks.darkMode = v}
  />
  
  <TweakColor
    label="Primary color"
    value={tweaks.primaryColor}
    options={['#6366f1', '#8b5cf6', '#ec4899']}
    onChange={(v) => tweaks.primaryColor = v}
  />
</TweaksPanel>
```

---

## Controles Disponibles

### TweakSection
Sección/encabezado en el panel.

```svelte
<TweakSection label="Typography" />
```

### TweakSlider
Slider deslizable con valor numérico.

```svelte
<TweakSlider 
  label="Spacing"
  value={spacing}
  min={0}
  max={50}
  step={1}
  unit="px"
  onChange={(v) => spacing = v}
/>
```

### TweakToggle
Botón de activar/desactivar.

```svelte
<TweakToggle
  label="Enable feature"
  value={enabled}
  onChange={(v) => enabled = v}
/>
```

### TweakColor
Selector de color con opciones predeterminadas.

```svelte
<TweakColor
  label="Brand color"
  value={color}
  options={[
    '#ff0000',
    ['#ff0000', '#ff6600', '#ffff00'],
    '#00ff00'
  ]}
  onChange={(v) => color = v}
/>
```

### TweakNumber
Input numérico con drag para ajustar.

```svelte
<TweakNumber
  label="Opacity"
  value={opacity}
  min={0}
  max={1}
  step={0.1}
  unit="%"
  onChange={(v) => opacity = v}
/>
```

---

## Ejemplo Completo

```svelte
<script>
  import AndroidDevice from '$lib/components/AndroidDevice.svelte';
  import TweaksPanel from '$lib/components/TweaksPanel.svelte';
  import { TweakSlider, TweakToggle, TweakColor, TweakSection } from '$lib/components/tweaks';
  
  let fontSize = 16;
  let darkMode = false;
  let primaryColor = '#6366f1';
</script>

<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
  <AndroidDevice 
    title="Mi App" 
    dark={darkMode}
    style="--primary-color: {primaryColor}; font-size: {fontSize}px"
  >
    <div style="padding: 20px; text-align: center;">
      <h1>Prototipo</h1>
      <p>Ajusta los tweaks a la derecha</p>
    </div>
  </AndroidDevice>

  <TweaksPanel title="Tweaks">
    <TweakSection label="Typography" />
    <TweakSlider 
      label="Font size"
      value={fontSize}
      min={10}
      max={32}
      unit="px"
      onChange={(v) => fontSize = v}
    />

    <TweakSection label="Theme" />
    <TweakToggle 
      label="Dark mode"
      value={darkMode}
      onChange={(v) => darkMode = v}
    />
    
    <TweakColor
      label="Primary"
      value={primaryColor}
      options={['#6366f1', '#8b5cf6', '#ec4899', '#10b981']}
      onChange={(v) => primaryColor = v}
    />
  </TweaksPanel>
</div>

<style>
  :global(body) {
    background: #0f172a;
    color: #fff;
    font-family: system-ui;
  }
</style>
```

---

## Notas

- Los componentes mantienen el estilo y comportamiento del original en React
- El TweaksPanel es responsive y se ajusta a la ventana
- Soporta drag para mover el panel
- Los controles persisten via postMessage al host (compatible con Figma-like systems)
