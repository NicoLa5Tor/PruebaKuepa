# PruebaKuepa

CRM para el seguimiento de leads de Kuepa. Frontend en React (Vite), backend en Node.js 18 con Express y MongoDB.

## Levantar con Docker

Copia `.env.example` a `.env` y define `JWT_SECRET` y `SEED_ADMIN_PASSWORD`.

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec back npm run cli -- --seeder initSeeder -f   # crea el usuario de prueba
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:7001 |
| MongoDB | mongodb://localhost:27017/kuepa_test |

Usuario de prueba: `useradminket`, con la contraseña definida en `SEED_ADMIN_PASSWORD`.

```bash
docker compose logs -f back   # ver logs del backend
docker compose down           # apagar (agregar -v para borrar los datos de Mongo)
```

## Levantar sin Docker

Requiere un MongoDB local en `127.0.0.1:27017` y copiar `back/.env.example` a `back/.env`.

```bash
cd back && npm i && npm run dev
cd front && npm i && npm run dev
```

## Variables de entorno

| Variable | Servicio | Default |
|---|---|---|
| `MONGO_URI` | back | `mongodb://127.0.0.1:27017/kuepa_test` |
| `PORT` | back | `7001` |
| `JWT_SECRET` | back | **obligatoria** |
| `SEED_ADMIN_PASSWORD` | back (seeder) | **obligatoria** para el seeder |
| `VITE_API_URL` | front (build) | `http://localhost:7001` |
