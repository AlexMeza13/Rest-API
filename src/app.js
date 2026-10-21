import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rutasAuth from './routes/auth.routes.js';
import rutasUsuarios from './routes/usuarios.routes.js';
import rutasJugadores from './routes/jugadores.routes.js';
import rutasRosters from './routes/rosters.routes.js';
import rutasAuxiliares from './routes/auxiliares.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './openapi.json' with { type: 'json' };
import { requerirRol, verificarCsrf, verificarToken } from './middleware/auth.middleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe estar configurado con al menos 32 caracteres');
}

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/v1/auth', rutasAuth);

app.use(
    '/api/v1/jugadores',
    verificarToken,
    verificarCsrf,
    requerirRol('admin', 'entrenador'),
    rutasJugadores
);

app.use('/api/v1/rosters', verificarToken, verificarCsrf, rutasRosters);

app.use('/api/v1/usuarios', verificarToken, verificarCsrf, rutasUsuarios);

app.use('/api/v1', rutasAuxiliares)

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ mensaje: 'API activa y funcionando' });
});

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || error.status || 500;

    if (statusCode === 500) {
        console.error('Error no controlado:', error);
    }

    res.status(statusCode).json({
        error: statusCode === 500 ? 'Error interno del servidor' : error.message
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});