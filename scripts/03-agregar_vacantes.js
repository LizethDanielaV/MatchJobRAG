import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import GeminiUtils from "../utils/GeminiUtils.js";
import PineconeUtils from "../utils/PineconeUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_VACANTES = path.join(__dirname, "../data/vacantes.json");
const NUEVAS_DESEADAS = 15;

const KEYWORDS = [
  "software", "developer", "web", "backend", "frontend", "fullstack",
  "full stack", "data", "cloud", "devops", "machine learning", "ai",
  "artificial intelligence", "python", "javascript", "java", "typescript",
  "api", "mobile", "ios", "android", "qa", "testing", "security",
  "cybersecurity", "database", "network", "sre", "platform", "engineer",
  "tech", "it ", "sistemas", "programming", "coder",
];

function esAfin(vacante) {
  const texto = `${vacante.title} ${vacante.tags?.join(" ")}`.toLowerCase();
  return KEYWORDS.some((kw) => texto.includes(kw));
}

function esUbicacionValida(vacante) {
  if (vacante.remote) return true;
  const ubicacion = vacante.location?.toLowerCase() || "";
  return ubicacion.includes("colombia");
}

function construirTextoVacante(vacante) {
  const modalidad = vacante.remoto ? "remota" : `presencial en ${vacante.ubicacion}`;
  const tags = vacante.tags ? ` Tecnologías y áreas: ${vacante.tags}.` : "";
  const descripcion = vacante.descripcion ? ` Descripción: ${vacante.descripcion}` : "";
  return `Vacante como ${vacante.titulo} en la empresa ${vacante.empresa}, en modalidad ${modalidad}.${tags}${descripcion}`.trim();
}

async function agregarVacantes() {
  const existentes = JSON.parse(fs.readFileSync(RUTA_VACANTES, "utf-8"));
  const urlsExistentes = new Set(existentes.map((v) => v.url));
  const siguienteId = existentes.length;

  console.log(`Vacantes actuales: ${existentes.length}. Buscando ${NUEVAS_DESEADAS} nuevas...\n`);

  const nuevas = [];
  let pagina = 1;

  while (nuevas.length < NUEVAS_DESEADAS) {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${pagina}`);
    const data = await res.json();

    if (!data.data || data.data.length === 0) break;

    const candidatas = data.data.filter(
      (v) => esAfin(v) && esUbicacionValida(v) && !urlsExistentes.has(v.url)
    );

    for (const v of candidatas) {
      if (nuevas.length >= NUEVAS_DESEADAS) break;
      nuevas.push({
        id: `vacante-${siguienteId + nuevas.length}`,
        titulo: v.title,
        empresa: v.company_name,
        ubicacion: v.location || "Remoto",
        remoto: v.remote,
        tags: v.tags?.join(", ") || "",
        descripcion: (v.description || "").replace(/<[^>]*>/g, "").slice(0, 500),
        url: v.url,
      });
    }

    console.log(`Página ${pagina}: ${candidatas.length} candidatas nuevas (acumuladas: ${nuevas.length})`);

    if (!data.links?.next) break;
    pagina++;
  }

  if (nuevas.length === 0) {
    console.log("No se encontraron vacantes nuevas en este momento. Intenta más tarde.");
    process.exit(0);
  }

  console.log(`\nGenerando embeddings para ${nuevas.length} vacantes nuevas...`);

  const gemini = new GeminiUtils();
  const pinecone = new PineconeUtils();
  const vectores = [];

  for (const vacante of nuevas) {
    const texto = construirTextoVacante(vacante);
    console.log(`[${vacante.id}] ${vacante.titulo}`);

    const embedding = await gemini.generarEmbeddings(texto);
    if (!embedding) {
      console.warn(`  ⚠ Sin embedding para ${vacante.id}, se omite.`);
      continue;
    }

    vectores.push({
      id: vacante.id,
      values: embedding,
      metadata: { titulo: vacante.titulo, empresa: vacante.empresa, ubicacion: vacante.ubicacion, remoto: vacante.remoto, tags: vacante.tags, url: vacante.url, texto },
    });
  }

  await pinecone.almacenarDatos(vectores);

  const todasLasVacantes = [...existentes, ...nuevas];
  fs.writeFileSync(RUTA_VACANTES, JSON.stringify(todasLasVacantes, null, 2));

  console.log(`\nListo. Pinecone ahora tiene ${todasLasVacantes.length} vacantes (${vectores.length} nuevas subidas).`);
}

agregarVacantes().catch((err) => console.error("ERROR:", err));
