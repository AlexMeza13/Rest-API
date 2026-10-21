import express from 'express';
import {
    crearJugador,
    listarJugadores,
    obtenerJugador,
    actualizarJugador,
    eliminarJugador
} from '../controllers/jugadores.controller.js';
import { requerirRol } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', requerirRol('admin'), crearJugador);
router.get('/', listarJugadores);
router.get('/:id', obtenerJugador);
router.put('/:id', requerirRol('admin'), actualizarJugador);
router.delete('/:id', requerirRol('admin'), eliminarJugador);

export default router;