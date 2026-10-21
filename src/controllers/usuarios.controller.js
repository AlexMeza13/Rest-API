import * as usuariosService from '../services/usuarios.service.js';

export const listarUsuarios = async (req, res) => {
    const usuarios = await usuariosService.listarUsuarios();
    res.status(200).json(usuarios);
};

export const crearUsuario = async (req, res) => {
    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON' });
    }

    const usuario = await usuariosService.crearUsuario(req.body);
    res.status(201).json(usuario);
};

export const actualizarUsuario = async (req, res) => {
    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON' });
    }

    const usuario = await usuariosService.actualizarUsuario(
        req.params.id,
        req.body,
        req.usuario.id
    );
    res.status(200).json(usuario);
};
