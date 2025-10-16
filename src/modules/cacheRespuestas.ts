import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 min de TTL

export function getCachedResponse(prompt: string) {
  const cached = cache.get(prompt);
  if (cached) console.log("💾 Respuesta obtenida desde caché");
  return cached;
}

export function setCachedResponse(prompt: string, response: string) {
  cache.set(prompt, response);
  console.log("✅ Respuesta guardada en caché");
}
