# API de eSports - Gestión de Perfiles y Rosters

API REST desarrollada en Node.js para la gestión de equipos de eSports. Permite administrar jugadores, crear rosters y asignar titulares/suplentes aplicando reglas de negocio específicas (MVC).

## Tecnologías Utilizadas
* **Backend:** Node.js (ES Modules), Express.js
* **Base de Datos:** MySQL (Dockerizada)
* **ORM:** Sequelize
* **Documentación:** Swagger UI (OpenAPI 3.0)

## Requisitos Previos
Para ejecutar este proyecto de manera local, necesitas tener instalado:
* Node.js (v20.10 o superior)
* Docker Desktop (para la base de datos)

## Instalación y Configuración

1. **Clonar el repositorio y entrar a la carpeta:**
   ```bash
   git clone "URL del repositorio"
   cd eaSports
   ```

2. **Instalar las dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Levantar la base de datos MySQL con Docker:**
   Inicia Docker Desktop y, desde la carpeta `eaSports`, ejecuta:
   ```bash
   docker compose up -d
   ```

4. **Revisar y ejecutar las migraciones:**
   Primero revisa qué migraciones están aplicadas y cuáles faltan:
   ```bash
   npm run db:migrate:status
   ```
   Aplica las migraciones pendientes:
   ```bash
   npm run db:migrate
   ```

## Ejecución del Servidor

Para iniciar el servidor en modo desarrollo (con recarga automática):

```bash
npm run dev
```

El servidor estará escuchando en http://localhost:3000. Para iniciarlo sin recarga automática usa `npm start`.

## Documentación de la API

La API cuenta con una interfaz gráfica interactiva para probar todos los endpoints (Jugadores, Rosters, Asignaciones y Auxiliares). 

Una vez que el servidor esté corriendo, abre tu navegador y visita:
http://localhost:3000/api/v1/docs

## Probar la API con REST Client

Con el servidor y MySQL en ejecución, abre `test-collection.http` en Visual Studio Code y ejecuta las solicitudes en orden con la extensión REST Client. La colección incluye casos de éxito y error para jugadores, rosters y asignaciones, y reutiliza IDs capturados de respuestas anteriores.

## Reglas de Negocio Implementadas
* **RN-01:** El nickname de un jugador debe ser único.
* **RN-02:** Un roster puede tener un máximo de 5 jugadores titulares.
* **RN-03:** No puede haber dos jugadores titulares con el mismo rol en un roster.
* **RN-05:** Al eliminar un roster, los perfiles de los jugadores permanecen intactos en la base de datos.