# API de eSports - Gestión de Perfiles y Rosters

API RESTful desarrollada en Node.js para la gestión de equipos de eSports. Permite administrar jugadores, crear rosters y asignar titulares/suplentes aplicando reglas de negocio específicas (MVC).

## Tecnologías Utilizadas
* **Backend:** Node.js (ES Modules), Express.js
* **Base de Datos:** MySQL (Dockerizada)
* **ORM:** Sequelize
* **Documentación:** Swagger UI (OpenAPI 3.0)

## Requisitos Previos
Para ejecutar este proyecto de manera local, necesitas tener instalado:
* Node.js (v18 o superior)
* Docker Desktop (para la base de datos)

## Instalación y Configuración

1. **Clonar el repositorio y entrar a la carpeta:**
   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   cd eaSports
   ```

2. **Instalar las dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Levantar la base de datos MySQL con Docker:**
   Asegúrate de tener Docker abierto y ejecuta:
   ```bash
   docker-compose up -d
   ```

4. **Ejecutar las migraciones:**
   Esto creará las tablas necesarias en la base de datos automáticamente:
   ```bash
   npx sequelize-cli db:migrate
   ```

## Ejecución del Servidor

Para iniciar el servidor en modo desarrollo (con recarga automática):

```bash
npx nodemon src/app.js
```

El servidor estará escuchando en http://localhost:3000.

## Documentación de la API

La API cuenta con una interfaz gráfica interactiva para probar todos los endpoints (Jugadores, Rosters, Asignaciones y Auxiliares). 

Una vez que el servidor esté corriendo, abre tu navegador y visita:
http://localhost:3000/api/v1/docs

## Reglas de Negocio Implementadas
* **RN-01:** El nickname de un jugador debe ser único.
* **RN-02:** Un roster puede tener un máximo de 5 jugadores titulares.
* **RN-03:** No puede haber dos jugadores titulares con el mismo rol en un roster.
* **RN-05:** Al eliminar un roster, los perfiles de los jugadores permanecen intactos en la base de datos.