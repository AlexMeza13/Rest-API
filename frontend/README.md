# EA Sports frontend

Aplicación Vue 3 + Vite para iniciar sesión y gestionar jugadores, rosters y sus alineaciones mediante la API de `eaSports`.

## Desarrollo local

1. Inicia MySQL y el backend desde `eaSports`. El backend debe escuchar en `http://localhost:3000`.
2. Crea el primer administrador siguiendo las instrucciones del README del backend.
3. Desde esta carpeta ejecuta:

   ```powershell
   npm install
   npm run dev
   ```

4. Abre `http://localhost:5173` e inicia sesión con la cuenta admin.

Vite reenvía `/api` al backend local. El navegador envía las cookies de sesión con `credentials: include`; el JWT permanece HttpOnly y el token CSRF se añade automáticamente a las operaciones que modifican datos.

En el apartado **Rosters**, selecciona un equipo para consultar su alineación, añadir jugadores disponibles, cambiar su asignación entre titular y suplente, o quitarlo del roster. Las reglas de titulares y roles las valida la API.

Para usar otro origen de API en un build, configura `VITE_API_BASE_URL` (por ejemplo, `https://api.example.com/api/v1`) antes de ejecutar `npm run build`. En ese caso, el backend debe permitir el origen del frontend mediante `CLIENT_URL` y CORS con credenciales.
