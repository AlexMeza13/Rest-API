import express from 'express';
import { crearJugador, listarJugadores } from '../controllers/jugadores.controller.js';

const router = express.Router();

router.post('/', crearJugador);
router.get('/', listarJugadores);

export default router;