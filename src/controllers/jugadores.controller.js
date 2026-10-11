import db from '../../models/index.js';
const { Jugador } = db;

export const crearJugador = async (req, res) => {
    try {
        const { nickname, nombre_real, pais, rol, estado } = req.body;

        const jugadorExistente = await Jugador.findOne({ where: { nickname } });
        if (jugadorExistente) {
            return res.status(409).json({ error: 'El nickname ya está en uso' });
        }

        const nuevoJugador = await Jugador.create({ nickname, nombre_real, pais, rol, estado });
        res.status(201).json(nuevoJugador);

    } catch (error) {
        console.error("Detalle del error:", error); // <-- Agregamos esta línea
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const listarJugadores = async (req, res) => {
    try {
        const jugadores = await Jugador.findAll();
        res.status(200).json(jugadores);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};