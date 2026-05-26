/**
 * Azure Function — trigger-call
 * Proxy seguro para disparar una llamada simulada hacia cc-services.
 * Las credenciales del servicio externo nunca se exponen al frontend.
 *
 * Método:  POST
 * Body esperado: { source, destination }
 *   - source:      extensión del agente humano (requerido)
 *   - destination: número del agente ElevenLabs según UC (requerido)
 * Respuesta: { ok: true } | { ok: false, error: string }
 */

const SEND_CALL_URL = "https://cc-services-h6gpc0gzdyfkdabj.eastus2-01.azurewebsites.net/api/sendCall?code=-6WX4-0QLQxj85AvLHuI-lADfPDw8wW-zXeJCeCx8r5uAzFuv4Iazw==";

// Mapa de UCs — destination por agente ElevenLabs
const UC_MAP = {
  "17876065812": "KAI Academy - UC - Asistencia Tranquilo F",
  "17876065813": "KAI Academy - UC - Asistencia Tranquilo M",
  "17876065814": "KAI Academy - UC - Asistencia Molesto F",
  "17876065815": "KAI Academy - UC - Asistencia Molesto M",
  "17876065816": "KAI Academy - UC - Gestión F",
  "17876065817": "KAI Academy - UC - Gestión M",
};

// Valores fijos — nunca cambian por ahora
const FIXED = {
  accountName: "Connect",
  branch:      "PR",
  poNumber:    "4117472"
};

module.exports = async function (context, req) {
  // Solo aceptar POST
  if (req.method !== "POST") {
    context.res = { status: 405, body: { ok: false, error: "Method not allowed" } };
    return;
  }

  // CORS
  const allowedOrigins = [
    "https://helios-transcript.connectlabs.tech",
    "http://localhost:3000"
  ];
  const origin = req.headers["origin"] || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // Preflight
  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers };
    return;
  }

  // Validar body
  const source      = req.body?.source;
  const destination = req.body?.destination;

  if (!source) {
    context.res = { status: 400, headers, body: { ok: false, error: "source (extensión del agente) es requerido" } };
    return;
  }
  if (!destination) {
    context.res = { status: 400, headers, body: { ok: false, error: "destination (UC a llamar) es requerido" } };
    return;
  }

  const ucName = UC_MAP[destination] || "UC desconocido";
  context.log(`trigger-call: source=${source} → destination=${destination} (${ucName})`);

  const payload = {
    source,
    destination,
    ...FIXED
  };

  try {
    const response = await fetch(SEND_CALL_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });

    const responseText = await response.text();
    context.log(`trigger-call: upstream responded ${response.status} — ${responseText}`);

    if (!response.ok) {
      context.res = {
        status: 502,
        headers,
        body: { ok: false, error: `Upstream error ${response.status}`, detail: responseText }
      };
      return;
    }

    context.res = {
      status: 200,
      headers,
      body: { ok: true, message: "Call triggered successfully", uc: ucName, source, destination }
    };

  } catch (err) {
    context.log.error("trigger-call fetch error:", err.message);
    context.res = {
      status: 500,
      headers,
      body: { ok: false, error: "Internal error", detail: err.message }
    };
  }
};
