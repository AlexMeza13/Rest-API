import express from 'express';
import {
    crearRoster,
    listarRosters,
    obtenerRoster,
    actualizarRoster,
    eliminarRoster,
    asignarJugador,
    quitarJugador,
    obtenerJugadoresDeRoster,
    actualizarRolEnRoster
} from '../controllers/rosters.controller.js';
const router = express.Router();

router.post('/', crearRoster);
router.get('/', listarRosters);
router.get('/:id', obtenerRoster);
router.put('/:id', actualizarRoster);
router.delete('/:id', eliminarRoster);
router.get('/:id/jugadores', obtenerJugadoresDeRoster);
router.post('/:id/jugadores', asignarJugador);
router.put('/:id/jugadores/:id_jugador', actualizarRolEnRoster);
router.delete('/:id/jugadores/:id_jugador', quitarJugador);

export default router;