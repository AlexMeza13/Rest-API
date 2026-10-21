import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';

const COOKIE_MAX_AGE = 60 * 60 * 1000;
const jwtOptions = {
    issuer: 'eaSports-api',
    audience: 'eaSports-client'
};

const cookieOptions = (httpOnly) => ({
    httpOnly,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
});

export const login = async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' ||
        email.trim() === '' || password === '') {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ error: 'La contraseña excede el limite permitido' });
    }

    const usuario = await db.Usuario.findOne({
        where: { email: email.trim().toLowerCase() }
    });
    const credencialesValidas = usuario &&
        await bcrypt.compare(password, usuario.password_hash);

    if (!credencialesValidas || usuario.estado !== 'activo') {
        return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    if (usuario.rol === 'jugador' && !usuario.id_jugador) {
        return res.status(403).json({ error: 'La cuenta jugador necesita un perfil vinculado' });
    }

    const csrfToken = crypto.randomBytes(32).toString('hex');
    const token = jwt.sign(
        { csrfToken },
        process.env.JWT_SECRET,
        { ...jwtOptions, subject: String(usuario.id), expiresIn: '1h' }
    );

    res.cookie('jwt_token', token, cookieOptions(true));
    res.cookie('csrf_token', csrfToken, cookieOptions(false));
    res.json({
        mensaje: 'Inicio de sesion exitoso',
        usuario: {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            id_jugador: usuario.id_jugador
        },
        csrfToken
    });
};

export const logout = (req, res) => {
    const options = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    };
    res.clearCookie('jwt_token', { ...options, httpOnly: true });
    res.clearCookie('csrf_token', options);
    res.status(200).json({ mensaje: 'Sesion cerrada exitosamente' });
};

export const verificarSesion = (req, res) => {
    res.json({ autenticado: true, usuario: req.usuario });
};
