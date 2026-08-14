import { Router } from "express";
import { buscarVacantes } from "../controllers/matchController.js";

const router = Router();

router.post("/buscar", buscarVacantes);

export default router;
