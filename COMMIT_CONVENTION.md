# Convención de Commits — Helios Transcript

## Formato

```
<tipo>(<scope>): <resumen corto en minúsculas>

- Detalle de qué cambió y por qué (punto por punto)
- Incluir contexto técnico relevante
- Mencionar archivos o funciones afectadas si aplica

Version: vX.Y.Z
Scope: <área del sistema>
Breaking: sí | no
```

---

## Tipos

| Tipo | Cuándo usarlo |
|------|--------------|
| `feat` | Nueva funcionalidad visible para el usuario |
| `fix` | Corrección de bug |
| `style` | Cambios de CSS/diseño sin impacto en lógica |
| `refactor` | Reorganización de código sin cambio de comportamiento |
| `perf` | Mejora de rendimiento |
| `chore` | Tareas de mantenimiento (deps, config, build) |
| `docs` | Solo documentación |

---

## Scopes comunes

| Scope | Área |
|-------|------|
| `nav` | Barra de navegación |
| `ui` | Interfaz general |
| `transcript` | Panel de transcripción en vivo |
| `po-builder` | Panel de creación de PO |
| `po-drawer` | Historial de POs |
| `dashboard` | Vista de análisis del día |
| `websocket` | Conexión WebPubSub / tiempo real |
| `smartfill` | Motor de auto-llenado de campos |
| `sentiment` | Análisis de sentimiento |
| `recs` | Recomendaciones en vivo |
| `timer` | Timer de llamada |
| `theme` | Sistema de temas claro/oscuro |
| `branding` | Logo, versión, identidad visual |

---

## Semver — cuándo subir versión

| Cambio | Versión |
|--------|---------|
| Rediseño completo, cambio de arquitectura, migración | `MAJOR` +1 → v2.0.0 |
| Nueva funcionalidad, nueva sección, nuevo módulo | `MINOR` +1 → v1.15.0 |
| Bug fix, ajuste de estilo, texto, corrección menor | `PATCH` +1 → v1.14.2 |

---

## Ejemplos

```
fix(websocket): corregir URL de negociación corrupta en CONFIG

- FUNCTION_URL tenía fragmento de código incrustado en el string
- Causaba fallo silencioso en connectWebPubSub() al arrancar
- Afectaba: CONFIG objeto, línea 1454 de index.html

Version: v1.14.1
Scope: websocket
Breaking: no
```

```
feat(po-builder): agregar campo VIN al formulario de creación de PO

- Nuevo input VIN en sección Vehículo del PO Builder
- SmartFill detecta y autollena VIN desde transcripción
- Validación básica de formato (17 caracteres alfanuméricos)

Version: v1.15.0
Scope: po-builder
Breaking: no
```

```
style(theme): botones nav bicolor según tema claro/oscuro

- Tema oscuro: iconos y texto en blanco con opacidad
- Tema claro: iconos y texto en gris neutro
- Aplica a: toggle de tema, botón dashboard, botón Demo

Version: v1.14.2
Scope: theme / nav
Breaking: no
```
