import bcrypt from 'bcryptjs';
import db from '../../models/index.js';

const { Usuario } = db;
const ROLES = ['admin', 'entrenador', 'jugador'];
const ESTADOS = ['activo', 'inactivo'];
const esIdJugadorValido = (id) => Number.isSafeInteger(id) && id > 0;

export class UsuarioServiceError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

const exponerUsuario = ({ id, email, rol, estado, id_jugador, createdAt, updatedAt }, jugador = null) => ({
    id,
    email,
    rol,
    estado,
    id_jugador,
    jugador: jugador ? { id: jugador.id, nickname: jugador.nickname } : null,
    createdAt,
    updatedAt
});

export const listarUsuarios = async () => {
    const usuarios = await Usuario.findAll({
        attributes: ['id', 'email', 'rol', 'estado', 'id_jugador', 'createdAt', 'updatedAt'],
        order: [['email', 'ASC']]
    });
    const jugadorIds = usuarios.map((usuario) => usuario.id_jugador).filter(Boolean);
    const jugadores = jugadorIds.length
        ? await db.Jugador.findAll({
            where: { id: jugadorIds },
            attributes: ['id', 'nickname']
        })
        : [];
    const jugadoresPorId = new Map(jugadores.map((jugador) => [jugador.id, jugador]));

    return usuarios.map((usuario) => exponerUsuario(
        usuario,
        jugadoresPorId.get(usuario.id_jugador)
    ));
};

export const crearUsuario = async ({ email, password, rol = 'entrenador', id_jugador }) => {
    if (typeof email !== 'string' || email.trim() === '' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new UsuarioServiceError(400, 'Ingresa un correo electronico valido');
    }
    if (typeof password !== 'string' || password.length < 8 ||
        Buffer.byteLength(password, 'utf8') > 72) {
        throw new UsuarioServiceError(400, 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes');
    }
    if (!ROLES.includes(rol)) {
        throw new UsuarioServiceError(400, 'El rol debe ser admin, entrenador o jugador');
    }
    if (rol === 'jugador' &&
        !esIdJugadorValido(id_jugador)) {
        throw new UsuarioServiceError(400, 'Debes vincular la cuenta con un perfil de jugador');
    }
    if (rol !== 'jugador' && id_jugador !== undefined && id_jugador !== null && id_jugador !== '') {
        throw new UsuarioServiceError(400, 'Solo las cuentas jugador pueden vincular un perfil');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existente = await Usuario.findOne({ where: { email: normalizedEmail } });
    if (existente) {
        throw new UsuarioServiceError(409, 'Ya existe una cuenta con ese correo');
    }

    try {
        const playerId = rol === 'jugador' ? id_jugador : null;
        if (playerId) {
            const jugador = await db.Jugador.findByPk(playerId);
            if (!jugador) throw new UsuarioServiceError(404, 'Perfil de jugador no encontrado');
            const cuentaVinculada = await Usuario.findOne({ where: { id_jugador: playerId } });
            if (cuentaVinculada) {
                throw new UsuarioServiceError(409, 'Ese perfil ya tiene una cuenta vinculada');
            }
        }

        const password_hash = await bcrypt.hash(password, 12);
        const usuario = await Usuario.create({
            email: normalizedEmail,
            password_hash,
            id_jugador: playerId,
            rol,
            estado: 'activo'
        });
        const jugador = playerId ? await db.Jugador.findByPk(playerId) : null;
        return exponerUsuario(usuario, jugador);
    } catch (error) {
        if (error instanceof UsuarioServiceError) throw error;
        if (error instanceof db.Sequelize.UniqueConstraintError) {
            throw new UsuarioServiceError(409, 'El correo o perfil de jugador ya tiene una cuenta');
        }
        throw error;
    }
};

export const actualizarUsuario = async (id, cambios, idAdmin) => {
    const usuarioId = Number(id);
    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        throw new UsuarioServiceError(400, 'El ID debe ser un entero positivo');
    }

    const { rol, estado, id_jugador } = cambios;
    if (rol !== undefined && !ROLES.includes(rol)) {
        throw new UsuarioServiceError(400, 'El rol debe ser admin, entrenador o jugador');
    }
    if (estado !== undefined && !ESTADOS.includes(estado)) {
        throw new UsuarioServiceError(400, 'El estado debe ser activo o inactivo');
    }
    if (id_jugador !== undefined && id_jugador !== null &&
        !esIdJugadorValido(id_jugador)) {
        throw new UsuarioServiceError(400, 'El perfil de jugador seleccionado no es valido');
    }
    if (rol === undefined && estado === undefined && id_jugador === undefined) {
        throw new UsuarioServiceError(400, 'Indica el nuevo rol, estado o perfil de jugador');
    }
    if (usuarioId === Number(idAdmin)) {
        throw new UsuarioServiceError(409, 'No puedes cambiar tu propio rol o estado');
    }

    try {
        return await db.sequelize.transaction(async (transaction) => {
            const usuario = await Usuario.findByPk(usuarioId, { transaction });
            if (!usuario) throw new UsuarioServiceError(404, 'Usuario no encontrado');

            const nuevoRol = rol ?? usuario.rol;
            const nuevoEstado = estado ?? usuario.estado;
            const nuevoJugadorId = nuevoRol === 'jugador'
                ? (id_jugador ?? usuario.id_jugador)
                : null;
            if (nuevoRol === 'jugador' && !esIdJugadorValido(nuevoJugadorId)) {
                throw new UsuarioServiceError(400, 'Debes vincular la cuenta con un perfil de jugador');
            }
            if (nuevoJugadorId) {
                const jugador = await db.Jugador.findByPk(nuevoJugadorId, { transaction });
                if (!jugador) throw new UsuarioServiceError(404, 'Perfil de jugador no encontrado');
                const cuentaVinculada = await Usuario.findOne({
                    where: { id_jugador: nuevoJugadorId },
                    transaction
                });
                if (cuentaVinculada && cuentaVinculada.id !== usuario.id) {
                    throw new UsuarioServiceError(409, 'Ese perfil ya tiene una cuenta vinculada');
                }
            }
            const pierdeAccesoAdmin = usuario.rol === 'admin' &&
                usuario.estado === 'activo' &&
                (nuevoRol !== 'admin' || nuevoEstado !== 'activo');

            if (pierdeAccesoAdmin) {
                const adminsActivos = await Usuario.findAll({
                    where: { rol: 'admin', estado: 'activo' },
                    attributes: ['id'],
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (adminsActivos.length <= 1) {
                    throw new UsuarioServiceError(409, 'Debe permanecer al menos un admin activo');
                }
            }

            await usuario.update({
                rol: nuevoRol,
                estado: nuevoEstado,
                id_jugador: nuevoJugadorId
            }, { transaction });
            const jugador = nuevoJugadorId
                ? await db.Jugador.findByPk(nuevoJugadorId, { transaction })
                : null;
            return exponerUsuario(usuario, jugador);
        });
    } catch (error) {
        if (error instanceof UsuarioServiceError) throw error;
        if (error instanceof db.Sequelize.UniqueConstraintError) {
            throw new UsuarioServiceError(409, 'Ese perfil ya tiene una cuenta vinculada');
        }
        throw error;
    }
};
