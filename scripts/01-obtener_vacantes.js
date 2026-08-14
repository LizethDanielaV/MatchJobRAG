import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_SALIDA = path.join(__dirname, "../data/vacantes.json");

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

async function obtenerVacantes() {
  const resultado = [];
  let pagina = 1;

  while (resultado.length < 35) {
    const res = await fetch(
      `https://www.arbeitnow.com/api/job-board-api?page=${pagina}`
    );
    const data = await res.json();

    if (!data.data || data.data.length === 0) break;

    const filtradas = data.data.filter((v) => esAfin(v) && esUbicacionValida(v));
    resultado.push(...filtradas);

    console.log(
      `Página ${pagina}: ${data.data.length} empleos → ${filtradas.length} afines (total acumulado: ${resultado.length})`
    );

    if (!data.links?.next) break;
    pagina++;
  }

  console.log(`\nTotal encontradas antes de recortar: ${resultado.length}`);
  console.log(`Guardando en: ${RUTA_SALIDA}`);

  const vacantes = resultado.slice(0, 35).map((v, i) => ({
    id: `vacante-${i}`,
    titulo: v.title,
    empresa: v.company_name,
    ubicacion: v.location || "Remoto",
    remoto: v.remote,
    tags: v.tags?.join(", ") || "",
    descripcion: (v.description || "").replace(/<[^>]*>/g, "").slice(0, 500),
    url: v.url,
  }));

  fs.writeFileSync(RUTA_SALIDA, JSON.stringify(vacantes, null, 2));
  console.log(`Guardadas ${vacantes.length} vacantes en data/vacantes.json`);
}

obtenerVacantes().catch((err) => console.error("ERROR:", err));