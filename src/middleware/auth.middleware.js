import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import db from '../../models/index.js';

const jwtOptions = {
    issuer: 'eaSports-api',
    audience: 'eaSports-client'
};

export const verificarToken = async (req, res, next) => {
    const token = req.cookies.jwt_token;
    if (!token) {
        return res.status(401).json({ error: 'Autenticacion requerida' });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, jwtOptions);
    } catch {
        return res.status(401).json({ error: 'Sesion invalida o expirada' });
    }

    if (typeof payload === 'string' || !payload.sub ||
        typeof payload.csrfToken !== 'string') {
        return res.status(401).json({ error: 'Sesion invalida o expirada' });
    }

    const usuario = await db.Usuario.findByPk(payload.sub);
    if (!usuario || usuario.estado !== 'activo') {
        return res.status(401).json({ error: 'Sesion invalida o expirada' });
    }

    req.usuario = {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        id_jugador: usuario.id_jugador
    };
    req.authCsrfToken = payload.csrfToken;
    next();
};

export const verificarCsrf = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies.csrf_token;
    const headerToken = req.get('X-CSRF-Token');
    const sessionToken = req.authCsrfToken;
    if (!cookieToken || !headerToken || !sessionToken) {
        return res.status(403).json({ error: 'Token CSRF requerido' });
    }

    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);
    const sessionBuffer = Buffer.from(sessionToken);
    if (cookieBuffer.length !== headerBuffer.length ||
        cookieBuffer.length !== sessionBuffer.length ||
        !crypto.timingSafeEqual(cookieBuffer, headerBuffer) ||
        !crypto.timingSafeEqual(cookieBuffer, sessionBuffer)) {
        return res.status(403).json({ error: 'Token CSRF invalido' });
    }

    next();
};

export const requerirRol = (...rolesPermitidos) => (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({ error: 'No tienes permisos para esta accion' });
    }

    next();
};

export const requerirAccesoRoster = async (req, res, next) => {
    if (req.usuario.rol === 'admin') {
        return next();
    }
    if (!/^[1-9]\d*$/.test(req.params.id)) {
        return next();
    }
    if (req.usuario.rol === 'entrenador') {
        const roster = await db.Roster.findByPk(req.params.id, {
            attributes: ['id_entrenador']
        });
        if (!roster) {
            return res.status(404).json({ error: 'Roster no encontrado' });
        }
        if (roster.id_entrenador !== req.usuario.id) {
            return res.status(403).json({ error: 'No tienes acceso a este roster' });
        }
        return next();
    }
    if (req.method !== 'GET') {
        return res.status(403).json({ error: 'El rol jugador solo tiene acceso de lectura' });
    }
    if (!req.usuario.id_jugador) {
        return res.status(403).json({ error: 'La cuenta jugador no esta vinculada a un perfil' });
    }
    if (!/^[1-9]\d*$/.test(req.params.id)) {
        return next();
    }

    const asignacion = await db.Roster_Jugador.findOne({
        where: {
            id_roster: req.params.id,
            id_jugador: req.usuario.id_jugador
        },
        attributes: ['id']
    });
    if (!asignacion) {
        return res.status(403).json({ error: 'No tienes acceso a este roster' });
    }

    next();
};

export const requerirPropietarioRoster = async (req, res, next) => {
    if (req.usuario.rol === 'admin') {
        return next();
    }
    if (!/^[1-9]\d*$/.test(req.params.id)) {
        return next();
    }

    const roster = await db.Roster.findByPk(req.params.id, {
        attributes: ['id_entrenador']
    });
    if (!roster) {
        return res.status(404).json({ error: 'Roster no encontrado' });
    }
    if (roster.id_entrenador !== req.usuario.id) {
        return res.status(403).json({ error: 'Solo puedes administrar tus propios rosters' });
    }

    next();
};
