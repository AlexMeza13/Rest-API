import express from 'express';
import { login, logout, verificarSesion } from '../controllers/auth.controller.js';
import { verificarToken, verificarCsrf } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', verificarToken, verificarCsrf, logout);
router.get('/verify', verificarToken, verificarSesion);

export default router;
