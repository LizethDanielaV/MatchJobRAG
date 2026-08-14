import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

class PineconeUtils {
  constructor() {
    this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    this.index = this.pinecone.index("mi-app-rag");
  }

  async almacenarDatos(datosFormateados) {
    try {
      await this.index.upsert(datosFormateados);
      console.log(`${datosFormateados.length} registros almacenados en Pinecone`);
    } catch (error) {
      console.error("Error al almacenar en Pinecone:", error);
    }
  }

  async buscarDatos(queryEmbedding, topK = 3) {
    try {
      const respuesta = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeValues: false,
        includeMetadata: true,
      });
      return respuesta.matches;
    } catch (error) {
      console.error("Error al buscar en Pinecone:", error);
    }
  }
  async borrarTodo() {
  try {
    await this.index.deleteAll();
    console.log("Todos los registros fueron eliminados del index");
  } catch (error) {
    console.error("Error al borrar los datos:", error);
  }
}

}

export default PineconeUtils;