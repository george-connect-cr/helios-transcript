# KAI Academy — Changelog

## [v0.1.0-beta] — 2026-05-26

Primera versión beta del portal de entrenamiento KAI Academy para agentes del Contact Center de Connect.

### ✨ Funcionalidades incluidas

#### Autenticación
- Login con Google SSO restringido a cuentas @connect.inc
- Selección de rol al ingresar (Agente, Formador, Supervisor, Admin, Demo)
- Conexión a Audara via extensión al iniciar sesión

#### Panel del agente
- Estados de disponibilidad: Coaching (default), Disponible, Almuerzo, Baño, Reunión, Capacitación, No disponible
- Wizard de bienvenida educativo con descripción de funcionalidades del portal
- Branding KAI Academy con logo Connect en header, login y reportes
- Tipografía Geist aplicada en todo el sitio
- Modo claro/oscuro

#### Motor de llamadas simuladas
- Llamada automática al ponerse en estado Disponible
- 2 UCs activos: UC-1 Asistencia Tranquilo F (17876065812) y UC-4 Asistencia Molesto M (17879654585)
- Selección aleatoria sin repetición de escenarios (Fisher-Yates shuffle)
- Máximo 5 llamadas por sesión
- Botón "Finalizar llamada" reemplaza Demo durante llamada activa
- Retorno automático a estado Coaching al finalizar
- Popup de evaluación post-llamada (nota, satisfacción, AHT, completitud)
- Limpieza de sesión entre llamadas (transcript, PO, mapas, sentimiento)

#### Transcripción en tiempo real
- Transcripción frase por frase via Azure WebPubSub
- Design system consistente: burbujas diferenciadas agente/cliente con avatar y timestamp
- Auto-scroll suave al fondo, flecha si el usuario sube >200px

#### Helios · Documentación de PO
- Secciones: Cliente, Vehículo, Ubicación, Servicio
- Barra de progreso por sección y global
- Inferencia automática desde transcripción (sin esperar LLM):
  - Nombre y apellido separados
  - Teléfono (patrones costarricenses 6xxx/7xxx/8xxx)
  - Placa (ABC-123)
  - Marca, modelo, año, color del vehículo
  - Nombre y teléfono del contacto
  - Ubicación origen (detecta "estoy en X", "frente a X", etc.)
  - Destino del taller (solo para grúa)
- Datos corregibles: nombre, placa, teléfono, ubicación se actualizan si el cliente corrige
- Datos estables: marca, color, año solo se llenan una vez

#### Ubicaciones con mini mapa
- Sección dedicada de Ubicación en el PO
- Campo "Ubicación de origen" siempre visible con mini mapa Leaflet + OpenStreetMap
- Campo "Ubicación de destino (taller)" visible solo cuando el servicio es Grúa
- Geocodificación via Nominatim con debounce 800ms
- Pin verde para origen, pin naranja para destino con badge "TALLER"
- Click en mapa → modal expandido con zoom nivel 16
- Edición manual del campo con actualización del mapa en tiempo real

#### Análisis de sentimiento
- Siempre visible en col-r durante la llamada
- 3 estados: 😄 Positivo / 😐 Neutro / 😠 Negativo
- Barra de progreso de sentimiento

#### KAI · Recomendaciones
- Checklist interactivo de protocolo según tipo de servicio detectado
- Ítems se auto-marcan cuando KAI infiere el dato correspondiente
- Click manual para marcar ítems como cumplidos
- Card de insight de KAI desde el LLM (aparece solo cuando hay sugerencia activa)

#### Reportes & Analytics
- Dashboard del agente con score, KPIs de sesión y historial de llamadas
- Página de reportes separada

---

### 🏗️ Arquitectura técnica

- **Frontend:** HTML/CSS/JS vanilla — GitHub Pages (helios-transcript.connectlabs.tech)
- **Transcripción:** Azure Web PubSub (WebSocket)
- **Análisis de KAI:** Azure Functions (cc-rtt endpoint)
- **Llamadas simuladas:** Audara + ElevenLabs via cc-services (Azure App Service)
- **Mapas:** Leaflet + OpenStreetMap + Nominatim
- **Fuente:** Geist (Google Fonts)

---

### ⚠️ Pendientes para v0.2.0

- [ ] UCs 2, 3, 5 y 6 pendientes de configurar en Audara con números reales
- [ ] Digitalizar matriz de calidad por país y carril (asignado a Jorge Marín)
- [ ] Integración de métricas adicionales (sentiment, cumplimiento protocolo, FCR)
- [ ] Login page con flujo de roles automático (sin selección manual)
- [ ] Panel del Formador
- [ ] Panel del Supervisor
