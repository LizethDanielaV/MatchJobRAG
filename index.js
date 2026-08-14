import "dotenv/config";
import express from "express";
import cors from "cors";
import matchRoutes from "./routes/matchRoutes.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
app.use(express.json());

app.use("/match", matchRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada.` });
});

app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
