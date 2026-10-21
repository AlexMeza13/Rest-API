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

5. **Configurar la autenticación:**
   Crea un archivo `.env` en la raíz del proyecto con una clave aleatoria de al menos 32 caracteres y el origen del frontend:
   ```env
   JWT_SECRET=
   CLIENT_URL=http://localhost:5173
   ADMIN_EMAIL=
   ADMIN_PASSWORD=
   ```
   No compartas ni subas el archivo `.env`. En PowerShell puedes generar una clave con:
   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

6. **Crear el primer administrador:**
   El comando de bootstrap solo crea un admin si todavía no existe ninguno. Completa `ADMIN_EMAIL` y `ADMIN_PASSWORD` localmente en `.env` (no subas ese archivo); la contraseña debe tener al menos 8 caracteres:
   ```powershell
   npm run user:create-admin
   ```
   La contraseña se almacena como hash. No hay registro público de cuentas.

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

El inicio y cierre de sesión están en `POST /api/v1/auth/login` y `POST /api/v1/auth/logout`; `GET /api/v1/auth/verify` devuelve la sesión actual. El login establece una cookie JWT `HttpOnly` y una cookie CSRF. Las operaciones que modifican datos requieren el encabezado `X-CSRF-Token`.

El rol `admin` puede crear, editar y eliminar perfiles de jugadores, además de gestionar todos los rosters y alineaciones. El rol `entrenador` puede consultar los perfiles registrados para agregarlos a sus rosters; puede crear rosters y administrar únicamente los que él creó, incluyendo editar y eliminar el roster y asignar, quitar o cambiar jugadores entre titulares y suplentes. No puede crear, editar ni eliminar perfiles ni administrar rosters de otros entrenadores. Los rosters existentes al añadir esta regla se asignan a `entrenador@gmail.com`. El rol `jugador` solo puede consultar los rosters donde esté asignado su perfil y los jugadores de esos grupos; no puede modificar información ni acceder a jugadores o rosters ajenos. Solo `admin` puede listar, crear y modificar cuentas mediante `/api/v1/usuarios` (`GET`, `POST` y `PUT /:id`). Al crear una cuenta jugador, el admin debe vincularla a un perfil existente. Desde el frontend, el apartado **Cuentas** permite crear usuarios, vincular perfiles, cambiarles el rol y activar o desactivar su acceso. No se permite cambiar el propio rol/estado ni desactivar o degradar al último admin activo. Las contraseñas deben tener al menos 8 caracteres y se almacenan como hash.

## Probar la API con REST Client

Con el servidor y MySQL en ejecución, abre `test-collection.http` en Visual Studio Code y ejecuta las solicitudes en orden con la extensión REST Client. La colección incluye casos de éxito y error para jugadores, rosters y asignaciones, y reutiliza IDs capturados de respuestas anteriores.

## Reglas de Negocio Implementadas
* **RN-01:** El nickname de un jugador debe ser único.
* **RN-02:** Un roster puede tener un máximo de 5 jugadores titulares.
* **RN-03:** No puede haber dos jugadores titulares con el mismo rol en un roster.
* **RN-05:** Al eliminar un roster, los perfiles de los jugadores permanecen intactos en la base de datos.