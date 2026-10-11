import db from '../../models/index.js';
const { Roster, Jugador, Roster_Jugador } = db;

export const crearRoster = async (req, res) => {
    try {
        const { nombre, juego = 'League of Legends', tipo, temporada } = req.body;

        const nuevoRoster = await Roster.create({ nombre, juego, tipo, temporada });
        res.status(201).json(nuevoRoster);
    } catch (error) {
        console.error("Detalle del error:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const listarRosters = async (req, res) => {
    try {
        const rosters = await Roster.findAll();
        res.status(200).json(rosters);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const obtenerRoster = async (req, res) => {
    try {
        const roster = await Roster.findByPk(req.params.id, {
            include: [{
                model: Jugador,
                through: { attributes: ['rol_en_roster'] }
            }]
        });

        if (!roster) return res.status(404).json({ error: 'Roster no encontrado' });

        const respuesta = roster.toJSON();
        respuesta.jugadores = respuesta.Jugadors.map(j => ({
            id: j.id,
            nickname: j.nickname,
            rol: j.rol,
            rol_en_roster: j.Roster_Jugador.rol_en_roster
        }));
        delete respuesta.Jugadors;

        res.status(200).json(respuesta);
    } catch (error) {
        console.error("Detalle del error:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const actualizarRoster = async (req, res) => {
    try {
        const { nombre, tipo, temporada } = req.body;
        const roster = await Roster.findByPk(req.params.id);

        if (!roster) return res.status(404).json({ error: 'Roster no encontrado' });

        await roster.update({ nombre, tipo, temporada });
        res.status(200).json(roster);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const eliminarRoster = async (req, res) => {
    try {
        const eliminados = await Roster.destroy({ where: { id: req.params.id } });
        if (!eliminados) return res.status(404).json({ error: 'Roster no encontrado' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const asignarJugador = async (req, res) => {
    try {
        const id_roster = req.params.id;
        const { id_jugador, rol_en_roster } = req.body;

        const roster = await Roster.findByPk(id_roster);
        if (!roster) return res.status(404).json({ error: 'Roster no encontrado' });

        const jugador = await Jugador.findByPk(id_jugador);
        if (!jugador) return res.status(404).json({ error: 'Jugador no encontrado' });

        if (rol_en_roster === 'Titular') {

            const cantidadTitulares = await Roster_Jugador.count({
                where: { id_roster, rol_en_roster: 'Titular' }
            });
            if (cantidadTitulares >= 5) {
                return res.status(409).json({ error: 'El roster ya alcanzó el máximo de 5 titulares' });
            }

            const titularesActuales = await Roster_Jugador.findAll({
                where: { id_roster, rol_en_roster: 'Titular' }
            });

            for (const asignacion of titularesActuales) {
                const jug = await Jugador.findByPk(asignacion.id_jugador);
                if (jug.rol === jugador.rol) {
                    return res.status(409).json({ error: `Ya existe un titular asignado con el rol de ${jugador.rol}` }); // 409 Conflict[cite: 9]
                }
            }
        }

        const nuevaAsignacion = await Roster_Jugador.create({
            id_roster,
            id_jugador,
            rol_en_roster
        });

        res.status(201).json(nuevaAsignacion);
    } catch (error) {
        console.error("Detalle del error:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const quitarJugador = async (req, res) => {
    try {
        const { id, id_jugador } = req.params;

        const eliminado = await Roster_Jugador.destroy({
            where: { id_roster: id, id_jugador }
        });

        if (!eliminado) return res.status(404).json({ error: 'Asignación no encontrada' });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const obtenerJugadoresDeRoster = async (req, res) => {
    try {
        const roster = await Roster.findByPk(req.params.id, {
            include: [{ model: Jugador, through: { attributes: ['rol_en_roster'] } }]
        });
        if (!roster) return res.status(404).json({ error: 'Roster no encontrado' });

        const jugadores = roster.Jugadors.map(j => ({
            id: j.id,
            nickname: j.nickname,
            rol: j.rol,
            rol_en_roster: j.Roster_Jugador.rol_en_roster
        }));
        res.status(200).json(jugadores);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const actualizarRolEnRoster = async (req, res) => {
    try {
        const { id, id_jugador } = req.params;
        const { rol_en_roster } = req.body;

        const asignacion = await Roster_Jugador.findOne({ where: { id_roster: id, id_jugador } });
        if (!asignacion) return res.status(404).json({ error: 'Asignación no encontrada' });

        if (rol_en_roster === 'Titular' && asignacion.rol_en_roster !== 'Titular') {
            const cantidadTitulares = await Roster_Jugador.count({ where: { id_roster: id, rol_en_roster: 'Titular' } });
            if (cantidadTitulares >= 5) return res.status(409).json({ error: 'Máximo 5 titulares' });

            const jugador = await Jugador.findByPk(id_jugador);
            const titularesActuales = await Roster_Jugador.findAll({ where: { id_roster: id, rol_en_roster: 'Titular' } });

            for (const asig of titularesActuales) {
                const jug = await Jugador.findByPk(asig.id_jugador);
                if (jug.rol === jugador.rol) return res.status(409).json({ error: `Ya existe un titular con rol ${jugador.rol}` });
            }
        }

        await asignacion.update({ rol_en_roster });
        res.status(200).json(asignacion);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};