import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

class GeminiUtils {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async generarEmbeddings(texto) {
    try {
      const respuesta = await this.ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: texto,
        config: { outputDimensionality: 1536 },
      });
      return respuesta.embeddings[0].values;
    } catch (error) {
      console.error("Error generando embedding:", error);
    }
  }

  async analizarPerfil(prompt) {
    try {
      const systemInstruction = `Eres un asesor de carrera para estudiantes de tecnología.
Responde ÚNICAMENTE en formato JSON con:
- area: área principal de interés (ej: "backend", "frontend", "datos", "QA")
- nivel: "junior" o "practicante"
- habilidades: array de habilidades clave detectadas en el perfil
- resumenBusqueda: una frase corta y densa para buscar vacantes afines`;

      const respuesta = await this.ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 200,
          temperature: 0.5,
        },
        contents: prompt,
      });

      return JSON.parse(respuesta.text);
    } catch (error) {
      console.error("Error al analizar perfil:", error);
    }
  }

  async analizarPerfilLaboral(texto) {
    try {
      const systemInstruction = `Eres un asesor de carrera especializado en perfiles de Ingeniería de Sistemas.
Analiza las características de la persona y responde ÚNICAMENTE en formato JSON con:
- area: área principal de interés ("backend", "frontend", "fullstack", "datos", "QA", "cloud", "seguridad", "mobile")
- nivel: "practicante" o "junior"
- habilidades: array de las habilidades técnicas más relevantes para buscar vacantes
- resumenBusqueda: una frase corta y densa que describa el perfil ideal de vacante para esta persona`;

      const respuesta = await this.ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 200,
          temperature: 0.6
        },
        contents: texto,
      });

      return JSON.parse(respuesta.text);
    } catch (error) {
      console.error("Error al analizar perfil laboral:", error);
    }
  }

  async analizarBrechas(perfilUsuario, vacante) {
    try {
      const systemInstruction = `Eres un asesor de carrera. Compara el perfil de un estudiante 
contra una vacante y responde en JSON con:
- afinidad: número del 1 al 10
- habilidadesFaltantes: array de habilidades que le faltan
- recomendacion: una frase corta de qué reforzar`;

      const prompt = `Perfil: ${perfilUsuario}\n\nVacante: ${vacante.titulo} en ${vacante.empresa}. Tags: ${vacante.tags}`;

      const respuesta = await this.ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        config: { systemInstruction, responseMimeType: "application/json", maxOutputTokens: 150 },
        contents: prompt,
      });

      return JSON.parse(respuesta.text);
    } catch (error) {
      console.error("Error en análisis de brechas:", error);
    }
  }
}

export default GeminiUtils;