import express from 'express';
import {
    crearJugador,
    listarJugadores,
    obtenerJugador,
    actualizarJugador,
    eliminarJugador
} from '../controllers/jugadores.controller.js';

const router = express.Router();

router.post('/', crearJugador);
router.get('/', listarJugadores);
router.get('/:id', obtenerJugador);
router.put('/:id', actualizarJugador);
router.delete('/:id', eliminarJugador);

export default router;