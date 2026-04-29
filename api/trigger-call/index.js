/**
 * Azure Function — trigger-call
 * Proxy seguro para disparar una llamada simulada hacia cc-services.
 * Las credenciales del servicio externo nunca se exponen al frontend.
 *
 * Método:  POST
 * Body esperado (opcional): { agentId, agentName }
 * Respuesta: { ok: true } | { ok: false, error: string }
 */

const SEND_CALL_URL = process.env.SEND_CALL_URL;
// Valores fijos de la llamada simulada — solo se configuran aquí, nunca en el frontend
const CALL_PAYLOAD = {
  source:      "4001",
  destination: "17876065812",
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

  // CORS — solo permitir origen del sitio
  const allowedOrigins = [
    "https://helios-transcript.connectlabs.tech",
    "http://localhost:3000" // para desarrollo local
  ];
  const origin = req.headers["origin"] || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  // Preflight
  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers };
    return;
  }

  if (!SEND_CALL_URL) {
    context.log.error("SEND_CALL_URL env var not set");
    context.res = { status: 500, headers, body: { ok: false, error: "Server misconfiguration" } };
    return;
  }

  try {
    context.log(`trigger-call: dispatching simulated call for agent=${req.body?.agentId || "unknown"}`);

    const response = await fetch(SEND_CALL_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(CALL_PAYLOAD)
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
      body: { ok: true, message: "Call triggered successfully" }
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
