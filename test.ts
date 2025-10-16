import { responderComoRRHH } from "./src/agents/usuarioSinteticoRRHH.js";

(async () => {
  const respuesta = await responderComoRRHH(
    "Acabo de lanzar una encuesta de clima y la participación es del 42%. ¿Qué estrategias puedo aplicar para aumentarla?"
  );

  console.log("🧠 Respuesta del Usuario Sintético RRHH:");
  console.log(respuesta);
})();
