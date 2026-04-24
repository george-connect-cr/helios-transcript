# Changelog — Helios Transcript

Todos los cambios notables de este proyecto se documentan aquí.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).  
Versiones bajo [Semantic Versioning](https://semver.org/lang/es/).

---

## [v1.14.1] — 2026-04-24

### Added
- Versión semver visible bajo el logo CONNECT en la barra de navegación
- Archivo `CHANGELOG.md` para seguimiento de cambios
- Archivo `COMMIT_CONVENTION.md` con convención de commits del equipo

### Fixed
- `FUNCTION_URL` en objeto CONFIG tenía texto corrupto incrustado dentro del string, rompiendo la conexión WebPubSub
- Fragmento `}IG={` (remanente de CONFIG duplicado) insertado dentro de la función `renderKBSugs`, generando error de sintaxis JS
- Tag `</script>` de cierre faltante al final del bloque JS principal; el navegador interpretaba HTML como código

### Changed
- Estructura de `.n-brand` cambiada de `flex-row` a `flex-column` para acomodar la versión debajo del logo

---

## [v1.14.0] — anterior (Dayana)

> Commits anteriores al sistema de versioning formal. Ver historial de git para detalle.

### Summary
- Rebuild limpio del JS sin corrupción
- Fix en botones de la UI
- Campo "tablilla" renombrado a "placa"
- Eliminación de `kb-card` del panel lateral

---

## [v1.13.0] — anterior (Dayana)

### Summary
- Checklist solo como cards
- Recomendaciones se descartan automáticamente por transcripción
- Recomendaciones con flash verde al marcar cumplidas

---

## [v1.0.0 — v1.12.0] — historial previo

Ver commits en git log para detalle de versiones anteriores.
