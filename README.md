# API de eSports - Gestión de Perfiles y Rosters

API REST desarrollada en Node.js para la gestión de equipos de eSports. Permite administrar jugadores, crear rosters y asignar titulares/suplentes aplicando reglas de negocio específicas (MVC).

## Tecnologías Utilizadas
* **Backend:** Node.js (ES Modules), Express.js
* **Frontend:** Vue 3, Vite
* **Base de Datos:** MySQL (Docker)
* **ORM:** Sequelize
* **Documentación:** Swagger UI (OpenAPI 3.0)

## Requisitos Previos
Para ejecutar este proyecto de manera local, necesitas tener instalado:
* Node.js
* Docker Desktop

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

5. **Configurar la autenticación:**
   Crea un archivo `.env` en la raíz del proyecto con una clave aleatoria de al menos 32 caracteres y el origen del frontend:
   ```env
   JWT_SECRET=
   CLIENT_URL=http://localhost:5173
   ADMIN_EMAIL=
   ADMIN_PASSWORD=
   ```
   En PowerShell puedes generar una clave con:
   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

6. **Crear el primer administrador:**
   El comando de bootstrap solo crea un admin si todavía no existe ninguno. Completa `ADMIN_EMAIL` y `ADMIN_PASSWORD` localmente en `.env` ; la contraseña debe tener al menos 8 caracteres:
   ```powershell
   npm run user:create-admin
   ```

## Ejecución del Servidor

Para iniciar el servidor en modo desarrollo (con recarga automática):

```bash
npm run dev
```

El servidor estará escuchando en http://localhost:3000. Para iniciarlo sin recarga automática usa `npm start`.

## Ejecución del Frontend

Con MySQL y el backend en ejecución, abre otra terminal desde la carpeta `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 e inicia sesión con una cuenta existente.


## Probar la API con REST Client

Con el servidor y MySQL en ejecución, abre `test-collection.http` en Visual Studio Code y ejecuta las solicitudes en orden con la extensión REST Client. La colección incluye casos de éxito y error para jugadores, rosters y asignaciones, y reutiliza IDs capturados de respuestas anteriores.

## Reglas de Negocio Implementadas
* **RN-01:** El nickname de un jugador debe ser único.
* **RN-02:** Un roster puede tener un máximo de 5 jugadores titulares.
* **RN-03:** No puede haber dos jugadores titulares con el mismo rol en un roster.
* **RN-05:** Al eliminar un roster, los perfiles de los jugadores permanecen intactos en la base de datos.