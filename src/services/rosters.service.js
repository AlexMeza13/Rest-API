import db from '../../models/index.js';

const { Roster, Jugador, Roster_Jugador } = db;

class RosterServiceError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const crearRoster = ({ nombre, juego = 'League of Legends', tipo, temporada }) =>
    Roster.create({ nombre, juego, tipo, temporada });

export const listarRosters = () => Roster.findAll();

export const obtenerRoster = async (id) => {
    const roster = await Roster.findByPk(id, {
        include: [{
            model: Jugador,
            through: { attributes: ['rol_en_roster'] }
        }]
    });

    if (!roster) throw new RosterServiceError(404, 'Roster no encontrado');

    const respuesta = roster.toJSON();
    respuesta.jugadores = respuesta.Jugadors.map((jugador) => ({
        id: jugador.id,
        nickname: jugador.nickname,
        rol: jugador.rol,
        rol_en_roster: jugador.Roster_Jugador.rol_en_roster
    }));
    delete respuesta.Jugadors;

    return respuesta;
};

export const actualizarRoster = async (id, datos) => {
    const roster = await Roster.findByPk(id);
    if (!roster) throw new RosterServiceError(404, 'Roster no encontrado');

    const { nombre, tipo, temporada } = datos;
    await roster.update({ nombre, tipo, temporada });
    return roster;
};

export const eliminarRoster = (id) => db.sequelize.transaction(async (transaction) => {
    const roster = await Roster.findByPk(id, { transaction });
    if (!roster) throw new RosterServiceError(404, 'Roster no encontrado');

    await Roster_Jugador.destroy({
        where: { id_roster: id },
        transaction
    });

    const eliminados = await Roster.destroy({
        where: { id },
        transaction
    });
    if (!eliminados) throw new RosterServiceError(404, 'Roster no encontrado');
});

export const asignarJugador = async (idRoster, datos) => {
    const { id_jugador, rol_en_roster } = datos;
    const roster = await Roster.findByPk(idRoster);
    if (!roster) throw new RosterServiceError(404, 'Roster no encontrado');

    const jugador = await Jugador.findByPk(id_jugador);
    if (!jugador) throw new RosterServiceError(404, 'Jugador no encontrado');

    if (rol_en_roster === 'Titular') {
        const cantidadTitulares = await Roster_Jugador.count({
            where: { id_roster: idRoster, rol_en_roster: 'Titular' }
        });
        if (cantidadTitulares >= 5) {
            throw new RosterServiceError(409, 'El roster ya alcanzo el maximo de 5 titulares');
        }

        const titularesActuales = await Roster_Jugador.findAll({
            where: { id_roster: idRoster, rol_en_roster: 'Titular' }
        });

        for (const asignacion of titularesActuales) {
            const titularActual = await Jugador.findByPk(asignacion.id_jugador);
            if (titularActual.rol === jugador.rol) {
                throw new RosterServiceError(409, `Ya existe un titular asignado con el rol de ${jugador.rol}`);
            }
        }
    }

    return Roster_Jugador.create({
        id_roster: idRoster,
        id_jugador,
        rol_en_roster
    });
};

export const quitarJugador = async (idRoster, idJugador) => {
    const eliminado = await Roster_Jugador.destroy({
        where: { id_roster: idRoster, id_jugador: idJugador }
    });
    if (!eliminado) throw new RosterServiceError(404, 'Asignacion no encontrada');
};

export const obtenerJugadoresDeRoster = async (id) => {
    const roster = await Roster.findByPk(id, {
        include: [{ model: Jugador, through: { attributes: ['rol_en_roster'] } }]
    });
    if (!roster) throw new RosterServiceError(404, 'Roster no encontrado');

    return roster.Jugadors.map((jugador) => ({
        id: jugador.id,
        nickname: jugador.nickname,
        rol: jugador.rol,
        rol_en_roster: jugador.Roster_Jugador.rol_en_roster
    }));
};

export const actualizarRolEnRoster = async (idRoster, idJugador, rolEnRoster) => {
    const asignacion = await Roster_Jugador.findOne({
        where: { id_roster: idRoster, id_jugador: idJugador }
    });
    if (!asignacion) throw new RosterServiceError(404, 'Asignacion no encontrada');

    if (rolEnRoster === 'Titular' && asignacion.rol_en_roster !== 'Titular') {
        const cantidadTitulares = await Roster_Jugador.count({
            where: { id_roster: idRoster, rol_en_roster: 'Titular' }
        });
        if (cantidadTitulares >= 5) {
            throw new RosterServiceError(409, 'Maximo 5 titulares');
        }

        const jugador = await Jugador.findByPk(idJugador);
        const titularesActuales = await Roster_Jugador.findAll({
            where: { id_roster: idRoster, rol_en_roster: 'Titular' }
        });

        for (const titularActual of titularesActuales) {
            const otroJugador = await Jugador.findByPk(titularActual.id_jugador);
            if (otroJugador.rol === jugador.rol) {
                throw new RosterServiceError(409, `Ya existe un titular con rol ${jugador.rol}`);
            }
        }
    }

    await asignacion.update({ rol_en_roster: rolEnRoster });
    return asignacion;
};
