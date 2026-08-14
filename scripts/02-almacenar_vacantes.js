import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import GeminiUtils from "../utils/GeminiUtils.js";
import PineconeUtils from "../utils/PineconeUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_VACANTES = path.join(__dirname, "../data/vacantes.json");

function construirTextoVacante(vacante) {
  const modalidad = vacante.remoto ? "remota" : `presencial en ${vacante.ubicacion}`;
  const tags = vacante.tags ? ` Tecnologías y áreas: ${vacante.tags}.` : "";
  const descripcion = vacante.descripcion ? ` Descripción: ${vacante.descripcion}` : "";

  return (
    `Vacante como ${vacante.titulo} en la empresa ${vacante.empresa}, ` +
    `en modalidad ${modalidad}.` +
    tags +
    descripcion
  ).trim();
}

async function almacenarVacantes() {
  if (!fs.existsSync(RUTA_VACANTES)) {
    console.error("No se encontró data/vacantes.json. Ejecuta primero el script 01.");
    process.exit(1);
  }

  const vacantes = JSON.parse(fs.readFileSync(RUTA_VACANTES, "utf-8"));
  console.log(`Procesando ${vacantes.length} vacantes...\n`);

  const gemini = new GeminiUtils();
  const pinecone = new PineconeUtils();

  const vectores = [];

  for (const vacante of vacantes) {
    const texto = construirTextoVacante(vacante);
    console.log(`[${vacante.id}] Generando embedding para: ${vacante.titulo}`);

    const embedding = await gemini.generarEmbeddings(texto);
    if (!embedding) {
      console.warn(`  ⚠ No se pudo generar embedding para ${vacante.id}, se omite.`);
      continue;
    }

    vectores.push({
      id: vacante.id,
      values: embedding,
      metadata: {
        titulo: vacante.titulo,
        empresa: vacante.empresa,
        ubicacion: vacante.ubicacion,
        remoto: vacante.remoto,
        tags: vacante.tags,
        url: vacante.url,
        texto,
      },
    });
  }

  console.log(`\nAlmacenando ${vectores.length} vectores en Pinecone...`);
  await pinecone.almacenarDatos(vectores);
  console.log("Listo. Vacantes almacenadas con embeddings en Pinecone.");
}

almacenarVacantes().catch((err) => console.error("ERROR:", err));
