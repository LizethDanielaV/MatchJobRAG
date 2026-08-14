import GeminiUtils from "../Utils/GeminiUtils.js";

const geminiUtils = new GeminiUtils();

async function main() {
  const embedding = await geminiUtils.generarEmbeddings("prueba de conexión");
  console.log("Conexión exitosa. Tamaño del embedding:", embedding.length);
}

main();