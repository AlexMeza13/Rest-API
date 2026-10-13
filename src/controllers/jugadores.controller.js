import * as jugadoresService from '../services/jugadores.service.js';

const validarDatosJugador = (body) => {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return 'El cuerpo de la solicitud debe ser un objeto JSON';
    }

    for (const campo of ['nickname', 'nombre_real', 'pais']) {
        if (typeof body[campo] !== 'string' || body[campo].trim() === '') {
            return `El campo "${campo}" es obligatorio y debe ser texto no vacio`;
        }
    }

    const valoresPermitidos = {
        rol: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
        estado: ['activo', 'inactivo']
    };

    for (const [campo, valores] of Object.entries(valoresPermitidos)) {
        if (typeof body[campo] !== 'string' || !valores.includes(body[campo])) {
            return `El campo "${campo}" debe ser uno de estos valores: ${valores.join(', ')}`;
        }
    }

    return null;
};

const validarIdJugador = (id) =>
    typeof id === 'string' && /^[1-9]\d*$/.test(id)
        ? null
        : 'El parametro "id" debe ser un entero positivo';

const responderErrorValidacion = (res, mensaje) =>
    res.status(400).json({ error: mensaje });

export const crearJugador = async (req, res) => {
    const errorValidacion = validarDatosJugador(req.body);
    if (errorValidacion) return responderErrorValidacion(res, errorValidacion);

    const jugador = await jugadoresService.crearJugador(req.body);
    res.status(201).json(jugador);
};

export const listarJugadores = async (req, res) => {
    const jugadores = await jugadoresService.listarJugadores();
    res.status(200).json(jugadores);
};

export const obtenerJugador = async (req, res) => {
    const errorValidacion = validarIdJugador(req.params.id);
    if (errorValidacion) return responderErrorValidacion(res, errorValidacion);

    const jugador = await jugadoresService.obtenerJugador(req.params.id);
    res.status(200).json(jugador);
};

export const actualizarJugador = async (req, res) => {
    const errorId = validarIdJugador(req.params.id);
    if (errorId) return responderErrorValidacion(res, errorId);

    const errorCuerpo = validarDatosJugador(req.body);
    if (errorCuerpo) return responderErrorValidacion(res, errorCuerpo);

    const jugador = await jugadoresService.actualizarJugador(req.params.id, req.body);
    res.status(200).json(jugador);
};

export const eliminarJugador = async (req, res) => {
    const errorValidacion = validarIdJugador(req.params.id);
    if (errorValidacion) return responderErrorValidacion(res, errorValidacion);

    await jugadoresService.eliminarJugador(req.params.id);
    res.status(204).send();
};
