import * as rostersService from '../services/rosters.service.js';

const validarIdRoster = (id, campo = 'id') =>
    typeof id === 'string' && /^[1-9]\d*$/.test(id)
        ? null
        : `El parametro "${campo}" debe ser un entero positivo`;

const validarDatosRoster = (body, { includeJuego = false } = {}) => {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return 'El cuerpo de la solicitud debe ser un objeto JSON';
    }

    for (const campo of ['nombre', 'tipo', 'temporada']) {
        if (typeof body[campo] !== 'string' || body[campo].trim() === '') {
            return `El campo "${campo}" es obligatorio y debe ser texto no vacio`;
        }
    }

    if (includeJuego && body.juego !== undefined &&
        (typeof body.juego !== 'string' || body.juego.trim() === '')) {
        return 'El campo "juego" debe ser texto no vacio';
    }

    if (!['Principal', 'Academy'].includes(body.tipo)) {
        return 'El campo "tipo" debe ser uno de estos valores: Principal, Academy';
    }

    return null;
};

const validarRolEnRoster = (rol) =>
    ['Titular', 'Suplente'].includes(rol)
        ? null
        : 'El campo "rol_en_roster" debe ser uno de estos valores: Titular, Suplente';

const validarDatosAsignacion = (body) => {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return 'El cuerpo de la solicitud debe ser un objeto JSON';
    }

    const errorRol = validarRolEnRoster(body.rol_en_roster);
    if (errorRol) return errorRol;

    if (!Number.isSafeInteger(body.id_jugador) || body.id_jugador <= 0) {
        return 'El campo "id_jugador" debe ser un entero positivo';
    }

    return null;
};

const responderErrorValidacion = (res, mensaje) =>
    res.status(400).json({ error: mensaje });

export const crearRoster = async (req, res) => {
    const errorValidacion = validarDatosRoster(req.body, { includeJuego: true });
    if (errorValidacion) return responderErrorValidacion(res, errorValidacion);

    const roster = await rostersService.crearRoster(req.body, req.usuario.id);
    res.status(201).json(roster);
};

export const listarRosters = async (req, res) => {
    const rosters = req.usuario.rol === 'jugador'
        ? await rostersService.listarRostersDeJugador(req.usuario.id_jugador)
        : req.usuario.rol === 'entrenador'
            ? await rostersService.listarRostersDeEntrenador(req.usuario.id)
            : await rostersService.listarRosters();
    res.status(200).json(rosters);
};

export const obtenerRoster = async (req, res) => {
    const errorValidacion = validarIdRoster(req.params.id);
    if (errorValidacion) return responderErrorValidacion(res, errorValidacion);

    const roster = await rostersService.obtenerRoster(req.params.id);
    res.status(200).json(roster);
};

export const actualizarRoster = async (req, res) => {
    const errorId = validarIdRoster(req.params.id);
    if (errorId) return responderErrorValidacion(res, errorId);

    const errorCuerpo = validarDatosRoster(req.body);
    if (errorCuerpo) return responderErrorValidacion(res, errorCuerpo);

    const roster = await rostersService.actualizarRoster(req.params.id, req.body);
    res.status(200).json(roster);
};

export const eliminarRoster = async (req, res) => {
    const errorValidacion = validarIdRoster(req.params.id);
    if (errorValidacion) return responderErrorValidacion(res, errorValidacion);

    await rostersService.eliminarRoster(req.params.id);
    res.status(204).send();
};

export const asignarJugador = async (req, res) => {
    const errorId = validarIdRoster(req.params.id);
    if (errorId) return responderErrorValidacion(res, errorId);

    const errorCuerpo = validarDatosAsignacion(req.body);
    if (errorCuerpo) return responderErrorValidacion(res, errorCuerpo);

    const asignacion = await rostersService.asignarJugador(req.params.id, req.body);
    res.status(201).json(asignacion);
};

export const quitarJugador = async (req, res) => {
    const errorIdRoster = validarIdRoster(req.params.id);
    if (errorIdRoster) return responderErrorValidacion(res, errorIdRoster);

    const errorIdJugador = validarIdRoster(req.params.id_jugador, 'id_jugador');
    if (errorIdJugador) return responderErrorValidacion(res, errorIdJugador);

    await rostersService.quitarJugador(req.params.id, req.params.id_jugador);
    res.status(204).send();
};

export const obtenerJugadoresDeRoster = async (req, res) => {
    const errorValidacion = validarIdRoster(req.params.id);
    if (errorValidacion) return responderErrorValidacion(res, errorValidacion);

    const jugadores = await rostersService.obtenerJugadoresDeRoster(req.params.id);
    res.status(200).json(jugadores);
};

export const actualizarRolEnRoster = async (req, res) => {
    const errorIdRoster = validarIdRoster(req.params.id);
    if (errorIdRoster) return responderErrorValidacion(res, errorIdRoster);

    const errorIdJugador = validarIdRoster(req.params.id_jugador, 'id_jugador');
    if (errorIdJugador) return responderErrorValidacion(res, errorIdJugador);

    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return responderErrorValidacion(res, 'El cuerpo de la solicitud debe ser un objeto JSON');
    }

    const errorRol = validarRolEnRoster(req.body.rol_en_roster);
    if (errorRol) return responderErrorValidacion(res, errorRol);

    const { rol_en_roster } = req.body;
    const asignacion = await rostersService.actualizarRolEnRoster(
        req.params.id,
        req.params.id_jugador,
        rol_en_roster
    );
    res.status(200).json(asignacion);
};
