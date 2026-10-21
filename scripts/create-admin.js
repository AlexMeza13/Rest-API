import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from '../models/index.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

try {
    if (!email || !password) {
        throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno');
    }
    if (password.length < 8) {
        throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres');
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('ADMIN_PASSWORD no puede superar 72 bytes');
    }

    const existente = await db.Usuario.findOne({ where: { email } });
    if (existente) {
        throw new Error('Ya existe una cuenta con ese email');
    }

    const adminExistente = await db.Usuario.findOne({ where: { rol: 'admin' } });
    if (adminExistente) {
        throw new Error('Ya existe un admin; este comando solo crea el primer admin');
    }

    const password_hash = await bcrypt.hash(password, 12);
    await db.Usuario.create({
        email,
        password_hash,
        rol: 'admin',
        estado: 'activo'
    });
    console.log(`Cuenta admin creada: ${email}`);
} catch (error) {
    console.error(`No se pudo crear el admin: ${error.message}`);
    process.exitCode = 1;
} finally {
    await db.sequelize.close();
}
