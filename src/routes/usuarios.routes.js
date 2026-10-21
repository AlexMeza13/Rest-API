import express from 'express';
import {
    actualizarUsuario,
    crearUsuario,
    listarUsuarios
} from '../controllers/usuarios.controller.js';
import { requerirRol } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requerirRol('admin'));
router.get('/', listarUsuarios);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);

export default router;
