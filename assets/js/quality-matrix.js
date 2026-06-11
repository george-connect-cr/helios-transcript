// ══════════════════════════════════════════════════════════════
// KB — Matriz de Calidad Road Assistance
// Fuente: KB_Matriz_de_calidad_Road.xlsx
// Última actualización: 2026-06-10
// Cada ítem vale 6.25 puntos. Total: 16 ítems = 100 puntos.
// ══════════════════════════════════════════════════════════════

const QUALITY_MATRIX = [
  // ─── Confiabilidad ──────────────────────────────────────────
  {
    id: 'q01',
    categoria: 'Confiabilidad',
    id_audara: 1,
    descripcion: '¿Confirma el número de contacto?',
    detalle: '¿El agente confirma o verifica el número telefónico del cliente para asegurar una correcta comunicación posterior?',
    puntaje: 6.25,
    keywords: ['teléfono', 'número', 'contacto', 'llamo', 'llamar', 'cuelgue', 'comunicar']
  },
  {
    id: 'q02',
    categoria: 'Confiabilidad',
    id_audara: 2,
    descripcion: '¿Menciona el área de asistencia?',
    detalle: '¿El agente informa al cliente al inicio que está siendo atendido por el área de asistencia para contextualizar adecuadamente la llamada?',
    puntaje: 6.25,
    keywords: ['asistencia', 'área de asistencia', 'connect', 'servicio de asistencia']
  },
  {
    id: 'q03',
    categoria: 'Confiabilidad',
    id_audara: 3,
    descripcion: '¿Menciona el compromiso de asistencia extraordinaria?',
    detalle: '¿El agente le indica al cliente "nuestro compromiso es brindarte una asistencia extraordinaria"?',
    puntaje: 6.25,
    keywords: ['compromiso', 'extraordinaria', 'asistencia extraordinaria', 'brindarte']
  },
  {
    id: 'q04',
    categoria: 'Confiabilidad',
    id_audara: 4,
    descripcion: '¿Solicita placa o identificación?',
    detalle: '¿El agente solicita el número de placa o el número de identificación durante la llamada?',
    puntaje: 6.25,
    keywords: ['placa', 'identificación', 'cédula', 'número de placa', 'id']
  },
  {
    id: 'q05',
    categoria: 'Confiabilidad',
    id_audara: 5,
    descripcion: '¿Informa que se dará seguimiento hasta finalizar?',
    detalle: '¿El agente le comunica al cliente antes de finalizar la llamada que su caso será monitoreado hasta su resolución?',
    puntaje: 6.25,
    keywords: ['monitoreando', 'monitoreo', 'seguimiento', 'hasta el final', 'resolución']
  },
  {
    id: 'q06',
    categoria: 'Confiabilidad',
    id_audara: 6,
    descripcion: '¿Se presenta con su nombre?',
    detalle: '¿El agente se presenta al inicio de la llamada indicando claramente su nombre?',
    puntaje: 6.25,
    keywords: ['me llamo', 'mi nombre', 'soy', 'le atiende', 'le habla']
  },
  {
    id: 'q07',
    categoria: 'Confiabilidad',
    id_audara: 7,
    descripcion: '¿Informa que se enviará progreso por WhatsApp?',
    detalle: '¿El agente le informa al cliente que será notificado del progreso de la asistencia a través de WhatsApp u otro canal?',
    puntaje: 6.25,
    keywords: ['whatsapp', 'progreso', 'informado', 'notificar', 'mantendremos informado']
  },
  // ─── Empatía ─────────────────────────────────────────────────
  {
    id: 'q08',
    categoria: 'Empatia',
    id_audara: 8,
    descripcion: '¿Trato respetuoso al cliente?',
    detalle: '¿El agente trata de una manera respetuosa al cliente durante la llamada?',
    puntaje: 6.25,
    keywords: ['disculpe', 'perdón', 'por favor', 'gracias', 'con gusto', 'claro que sí']
  },
  {
    id: 'q09',
    categoria: 'Empatia',
    id_audara: 9,
    descripcion: '¿Utiliza tono claro y empático?',
    detalle: '¿El agente utiliza un tono de voz claro, empático y profesional que transmita calma y disposición para ayudar?',
    puntaje: 6.25,
    keywords: ['entiendo', 'comprendo', 'tranquilo', 'calma', 'ayudar', 'apoyar']
  },
  {
    id: 'q10',
    categoria: 'Empatia',
    id_audara: 10,
    descripcion: '¿Brinda explicaciones comprensibles?',
    detalle: '¿El agente comunica la información de forma comprensible, evitando tecnicismos innecesarios y confirmando que el cliente entienda?',
    puntaje: 6.25,
    keywords: ['¿me entiende?', '¿quedó claro?', 'es decir', 'en otras palabras', '¿alguna duda?']
  },
  // ─── Facilidad ───────────────────────────────────────────────
  {
    id: 'q11',
    categoria: 'Facilidad',
    id_audara: 11,
    descripcion: '¿Demuestra conocimiento del servicio?',
    detalle: '¿El agente demuestra dominio de los procedimientos y servicios disponibles, brindando respuestas precisas y seguras?',
    puntaje: 6.25,
    keywords: ['procedimiento', 'protocolo', 'servicio', 'cobertura', 'incluye', 'aplica']
  },
  {
    id: 'q12',
    categoria: 'Facilidad',
    id_audara: 12,
    descripcion: '¿Escucha activamente al cliente?',
    detalle: '¿El agente escucha activamente al cliente y permite que exprese su solicitud o necesidad?',
    puntaje: 6.25,
    keywords: ['cuénteme', 'dígame', 'adelante', 'escucho', 'entiendo su situación']
  },
  {
    id: 'q13',
    categoria: 'Facilidad',
    id_audara: 13,
    descripcion: '¿Maneja correctamente las inquietudes del cliente?',
    detalle: '¿El agente maneja quejas, dudas u objeciones del cliente con seguridad, empatía y soluciones claras?',
    puntaje: 6.25,
    keywords: ['queja', 'molestia', 'inconveniente', 'problema', 'objeción', 'preocupación']
  },
  {
    id: 'q14',
    categoria: 'Facilidad',
    id_audara: 14,
    descripcion: '¿Resuelve eficazmente la solicitud?',
    detalle: '¿El agente ofrece una solución concreta a la solicitud planteada, o toma acción clara hacia su resolución?',
    puntaje: 6.25,
    keywords: ['vamos a proceder', 'ya estamos gestionando', 'en este momento', 'solución', 'gestionar']
  },
  {
    id: 'q15',
    categoria: 'Facilidad',
    id_audara: 15,
    descripcion: '¿Pregunta cómo puede ayudar ("¿Qué situación te puedo solucionar?")?',
    detalle: '¿El agente formula de manera proactiva la pregunta: "¿Qué situación te puedo solucionar?" para entender mejor la necesidad del cliente?',
    puntaje: 6.25,
    keywords: ['qué situación', 'puedo solucionar', 'en qué te puedo ayudar', 'cómo te puedo ayudar']
  },
  // ─── Urgencia ────────────────────────────────────────────────
  {
    id: 'q16',
    categoria: 'Urgencia',
    id_audara: 16,
    descripcion: '¿Informa el tiempo estimado de llegada?',
    detalle: '¿El agente proporciona al cliente un tiempo estimado de llegada o solución, transmitiendo seguridad y control del caso?',
    puntaje: 6.25,
    keywords: ['minutos', 'tiempo estimado', 'llegará en', 'aproximadamente', 'eta', 'en camino']
  }
];

// Categorías para agrupar visualmente en el panel
const QUALITY_CATEGORIES = {
  'Confiabilidad': { color: '#3b82f6', icon: 'ti-shield-check', items: 7 },
  'Empatia':       { color: '#f59e0b', icon: 'ti-heart',        items: 3 },
  'Facilidad':     { color: '#22c55e', icon: 'ti-thumb-up',     items: 5 },
  'Urgencia':      { color: '#e04500', icon: 'ti-clock',        items: 1 }
};

// Exportar
if (typeof module !== 'undefined') module.exports = { QUALITY_MATRIX, QUALITY_CATEGORIES };
