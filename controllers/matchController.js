import GeminiUtils from "../utils/GeminiUtils.js";
import PineconeUtils from "../utils/PineconeUtils.js";
import { construirTextoPerfilUsuario, construirTextoBusqueda } from "../utils/PerfilUtils.js";

const gemini = new GeminiUtils();
const pinecone = new PineconeUtils();

const UMBRAL_SIMILITUD = 0.6;

async function buscarVacantes(req, res) {
  try {
    const datosPerfil = req.body;

    const textoPerfil = construirTextoPerfilUsuario(datosPerfil);

    const perfilJSON = await gemini.analizarPerfilLaboral(textoPerfil);
    if (!perfilJSON) {
      return res.status(500).json({ error: "No se pudo analizar el perfil." });
    }

    const textoBusqueda = construirTextoBusqueda(perfilJSON);

    const embedding = await gemini.generarEmbeddings(textoBusqueda);
    if (!embedding) {
      return res.status(500).json({ error: "No se pudo generar el embedding." });
    }

    const matches = await pinecone.buscarDatos(embedding, 10);

    console.log(
      "Scores Pinecone:",
      matches.map((m) => `${m.id}: ${m.score.toFixed(4)}`)
    );

    const altaCoincidencia = matches.filter((m) => m.score >= UMBRAL_SIMILITUD);

    res.json({
      perfil: perfilJSON,
      vacantes: altaCoincidencia.map((m) => ({
        score: m.score,
        ...m.metadata,
      })),
    });
  } catch (error) {
    console.error("Error en buscarVacantes:", error);
    res.status(500).json({ error: "Error interno al buscar vacantes." });
  }
}

export { buscarVacantes };
