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
import {
    requerirAccesoRoster,
    requerirPropietarioRoster,
    requerirRol
} from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/', requerirRol('admin', 'entrenador'), crearRoster);
router.get('/', requerirRol('admin', 'entrenador', 'jugador'), listarRosters);
router.get('/:id', requerirAccesoRoster, obtenerRoster);
router.put('/:id', requerirRol('admin', 'entrenador'), requerirPropietarioRoster, actualizarRoster);
router.delete('/:id', requerirRol('admin', 'entrenador'), requerirPropietarioRoster, eliminarRoster);
router.get('/:id/jugadores', requerirAccesoRoster, obtenerJugadoresDeRoster);
router.post('/:id/jugadores', requerirRol('admin', 'entrenador'), requerirPropietarioRoster, asignarJugador);
router.put('/:id/jugadores/:id_jugador', requerirRol('admin', 'entrenador'), requerirPropietarioRoster, actualizarRolEnRoster);
router.delete('/:id/jugadores/:id_jugador', requerirRol('admin', 'entrenador'), requerirPropietarioRoster, quitarJugador);

export default router;