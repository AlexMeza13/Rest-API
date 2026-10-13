import express from 'express';
import cors from 'cors';
import rutasJugadores from './routes/jugadores.routes.js';
import rutasRosters from './routes/rosters.routes.js';
import rutasAuxiliares from './routes/auxiliares.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './openapi.json' with { type: 'json' };

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/v1/jugadores', rutasJugadores);

app.use('/api/v1/rosters', rutasRosters);

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