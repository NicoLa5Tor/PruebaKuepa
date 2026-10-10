# PruebaKuepa

CRM para el seguimiento de leads de Kuepa. Frontend en React (Vite), backend en Node.js 18 con Express, MongoDB y notificaciones en tiempo real con Socket.IO + Redis.

Prueba técnica desarrollada por **Nicolás Rodríguez Torres**.

## Levantar con Docker

Copia `back/.env.example` a `back/.env` y define `JWT_SECRET` y `SEED_ADMIN_PASSWORD`. Es el mismo archivo con y sin Docker.

```bash
cp back/.env.example back/.env
docker compose up -d --build
docker compose exec back npm run cli -- --seeder initSeeder -f   # usuario de prueba
docker compose exec back npm run cli -- --seeder crmSeeder -f    # programas, asesor, canales, campaña y configuración
```

| Servicio | URL |
|---|---|
| CRM | http://localhost:5173 |
| Formulario público de inscripción | http://localhost:5173/inscripcion |
| API | http://localhost:7001 |
| MongoDB | mongodb://localhost:27017/kuepa_test |

Usuario de prueba: `useradminket`, con la contraseña definida en `SEED_ADMIN_PASSWORD`.

```bash
docker compose logs -f back   # ver logs del backend
docker compose down           # apagar (agregar -v para borrar los datos de Mongo)
```

## Qué se construyó

### Formularios de leads
- **CRM (`/leads`)**: un asesor registra prospectos desde un panel lateral; la tabla tiene búsqueda y estados.
- **Público (`/inscripcion`)**: el prospecto deja sus datos sin iniciar sesión y el lead llega al CRM por el canal orgánico.
- Ambos usan el mismo componente `LeadForm` y la misma validación en el back (campos obligatorios, email, celular, documento y programa activo).

### Modelo de datos
Se respetó el modelo existente:

- **Lead** → el interés de una persona en un **Program**. Lo atiende un asesor (`adviser`), entra por un canal (`adnetwork`: orgánico o manual) dentro de una `campaign`.
- **Third** (`type: 'cli'`) → la persona. Se identifica por tipo y número de documento; si vuelve a registrarse, se reutiliza su contacto y se registra el nuevo interés como seguimiento.
- **Third** (`type: 'emp'`) → el asesor, ligado a su `User`.

Reglas de negocio:
- No se permite un segundo lead abierto para la misma persona (`409`).
- Cada asesor solo ve y edita sus propios leads.
- El endpoint público nunca modifica contactos existentes.

### Datos configurables
Los datos que muestran los formularios no están en el código: viven en la colección `settings` y se sirven por `GET /api/global/setting/:key` (solo las marcadas como públicas).
- `document_types`: tipos de documento del formulario. El back valida contra esta misma lista.
- `inscription_page`: título, descripción y beneficios de `/inscripcion`.
- Los programas vienen de la colección `programs` (`GET /api/program`).

El `crmSeeder` carga los valores iniciales; sin él el formulario no puede registrar leads.

### Dashboard (`/home`)
Métricas calculadas en Mongo (totales, últimos 7 días, por programa y por estado), últimos registros y accesos rápidos.

### Notificaciones en tiempo real

```
Navegador ──WebSocket (Socket.IO)──► Back ──► Redis (pub/sub) ◄── otras instancias del back
```

- Cuando entra un lead por el formulario público, al asesor le llega una notificación persistida (campana con contador de no leídas). La tabla de `/leads` y las métricas del dashboard se actualizan sin recargar.
- El socket se autentica con el mismo JWT de la API y cada asesor recibe solo sus eventos (sala `adviser:<id>`).
- **Por qué Redis:** con una sola instancia del back, Socket.IO funciona solo. Redis (`@socket.io/redis-adapter`) permite correr varias instancias detrás de un balanceador: un evento emitido en una instancia llega a los navegadores conectados a cualquier otra. Es opcional (`REDIS_URL`); si Redis se cae, el back sigue funcionando y se reconecta solo cuando vuelve.
- Para escalar a varias réplicas en el compose habría que agregar un balanceador, porque el puerto `7001` está fijo.

### Inicio de sesión con Google y Facebook (Logto)

```
CRM ──popup──► Logto ──► Google / Facebook
 ▲               │
 └── postMessage ◄── /callback (popup): ID token ──► POST /api/auth/logto ──► nuestra sesión
```

- Logto solo autentica. El back valida el **ID token** (firma con las llaves públicas de Logto, emisor y audiencia) y entrega **la misma sesión** que el login con contraseña, así que guards, socket y permisos no cambian.
- Solo entran usuarios que ya existen en el CRM: se vinculan por `email` verificado la primera vez y después por `logto_id`. Una cuenta ya vinculada no se re-vincula a otra identidad social.
- El flujo se abre en una **ventana emergente**: si algo falla en Logto o en el proveedor, la pestaña del CRM sigue ahí y avisa al cerrar el popup. Si el navegador bloquea el popup, se usa la redirección normal como respaldo.
- En Logto el **registro está habilitado** y no pide identificadores extra en el registro social (*skip required identifiers*): una cuenta social nueva se crea en Logto sin pantallas adicionales y vuelve al CRM, que responde "Tu cuenta no tiene acceso" si su email no está registrado. Con el registro deshabilitado, Logto se quedaría en su pantalla de "cuenta no registrada" sin volver a la app.
- **Configuración en Logto:** una aplicación de tipo *Single Page App* con:
  - Redirect URI: `http://localhost:5173/callback`
  - Post sign-out: `http://localhost:5173/auth`
  - CORS: `http://localhost:5173`

  Su App ID va en `LOGTO_APP_ID` y `VITE_LOGTO_APP_ID`. Los conectores de Google y Facebook se configuran en Logto, no en el CRM.

### Seguridad
- Las rutas del CRM están protegidas en el front (`RequireAuth`) y en el back (`authMiddleware`).
- `user_logged` solo se toma del middleware, nunca del body.
- Los endpoints reciben una lista blanca de campos.
- Los secretos viven en `.env` y no se suben al repositorio.
- **Captcha (Cloudflare Turnstile)** en el login con contraseña y en el formulario público. El back lo verifica (`captchaMiddleware`) y falla cerrado si no hay secreto configurado. El repo trae las **llaves de prueba oficiales** de Cloudflare (siempre pasan, el widget muestra "Solo para pruebas"). En producción:
  - `TURNSTILE_SECRET` en `back/.env`.
  - `VITE_TURNSTILE_SITE_KEY` en `docker-compose.yml`.
  - El hostname del sitio agregado al widget en Cloudflare.
- **Límite de peticiones por IP** (`rateLimitMiddleware`), guardado en Redis y compartido entre instancias, con respaldo en memoria si Redis cae. Al exceder responde `429` con `Retry-After`:

  | Ruta | Límite |
  |---|---|
  | `/auth/login` | 10 cada 15 minutos |
  | `/auth/logto` | 20 cada 15 minutos |
  | `/lead/external` | 10 por hora |

  Detrás de un proxy, `TRUST_PROXY=true` para leer la IP real.
- **Login:** usuario inexistente y contraseña incorrecta responden igual (`401 auth.login.error`), así que no se puede averiguar qué usuarios existen.
- **Usuarios:** solo autoservicio sobre el propio usuario (`/user/upsert` edita el perfil con lista blanca; `/user/upsert-address`). El base no aplica un rol de admin (`can()` siempre es `true`), así que listar, ver, borrar, registrar o editar a otros usuarios no se expone por HTTP.
- **Pendiente para producción:** el `docker-compose.yml` publica MongoDB (`27017`) **sin contraseña**. Fuera de un entorno local hay que quitar esa publicación (o limitarla a `127.0.0.1`) y activar autenticación en Mongo.

## Levantar sin Docker

Requiere un MongoDB local en `127.0.0.1:27017` y el mismo `back/.env`. Redis es opcional.

```bash
cd back && npm i && npm run dev
cd front && npm i && npm run dev
```

## Variables de entorno

| Variable | Servicio | Default |
|---|---|---|
| `MONGO_URI` | back | `mongodb://127.0.0.1:27017/kuepa_test` |
| `REDIS_URL` | back | vacío (sin adaptador, una sola instancia) |
| `PORT` | back | `7001` |
| `JWT_SECRET` | back | **obligatoria** |
| `SEED_ADMIN_PASSWORD` | back (seeder) | **obligatoria** para el seeder |
| `SEED_ADMIN_EMAIL` | back (seeder) | vacío; con él, el usuario de prueba entra por Google o Facebook |
| `LOGTO_ENDPOINT` / `LOGTO_APP_ID` | back | vacíos; necesarios para el inicio de sesión social |
| `VITE_LOGTO_ENDPOINT` / `VITE_LOGTO_APP_ID` | front (build) | definidos en `docker-compose.yml` |
| `TURNSTILE_SECRET` | back | llave de prueba de Cloudflare (siempre pasa) |
| `VITE_TURNSTILE_SITE_KEY` | front (build) | llave de prueba de Cloudflare, en `docker-compose.yml` |
| `TRUST_PROXY` | back | `false` |
| `VITE_API_URL` | front (build) | `http://localhost:7001` |

## Mejoras identificadas (no incluidas)
- `can()` en `front/src/atoms/kuepa.ts` siempre devuelve `true`: los permisos por rol no se aplican.
- Uso extendido de `any` y parámetros sin tipar en los servicios del back.
- Dependencias sin uso: `puppeteer`, `twilio`, `pdf-parse`, `redis-om`.
- Los endpoints `/test` de los dominios originales siguen siendo públicos.
