# Enterprise Deployment Assets

This folder contains on-prem deployment packaging for Simple POS:

- `docker-compose.onprem.yml` for single-node/VM deployments
- `start-local.sh` to auto-build missing images and start the stack
- `helm/simple-pos` chart for Kubernetes-based enterprise clusters

## Docker Compose (On-Prem)

### Prerequisites

- Docker Engine + Docker Compose plugin installed
- Run commands from the repository root (`simple-pos/`)

### Option A: Start with auto-build (recommended)

```bash
./deploy/enterprise/start-local.sh
```

What this does:

- Ensures `simplepos/pos:latest` exists (builds if missing)
- Ensures `simplepos/api:latest` exists (builds if missing)
- Creates `.env.enterprise` from `deploy/enterprise/.env.enterprise.example` if missing
- Starts the full stack in detached mode (`pos-web`, `api`, `postgres`, `redis`)

Open after startup:

- POS web: `http://localhost:8080`
- API base: `http://localhost:3000/api/v1`

### Option B: Manual start

```bash
cp deploy/enterprise/.env.enterprise.example .env.enterprise
# update .env.enterprise values as needed

docker compose --env-file .env.enterprise -f deploy/enterprise/docker-compose.onprem.yml up -d
```

### Useful lifecycle commands

```bash
# check containers
docker compose --env-file .env.enterprise -f deploy/enterprise/docker-compose.onprem.yml ps

# view logs
docker compose --env-file .env.enterprise -f deploy/enterprise/docker-compose.onprem.yml logs -f

# rebuild and restart (after code or Dockerfile changes)
docker compose --env-file .env.enterprise -f deploy/enterprise/docker-compose.onprem.yml up -d --build

# stop stack
docker compose --env-file .env.enterprise -f deploy/enterprise/docker-compose.onprem.yml down
```

### Troubleshooting

- `port is already allocated`: Change `POS_HTTP_PORT` / `API_HTTP_PORT` in `.env.enterprise`, then restart.
- Browser CORS errors from POS to API: Ensure `CORS_ORIGINS` in `.env.enterprise` includes your POS origin (for local Docker use `http://localhost:8080`).
- Login returns `500` with `The table public.users does not exist`: recreate API so startup schema sync runs: `docker compose --env-file .env.enterprise -f deploy/enterprise/docker-compose.onprem.yml up -d --build api`.
- POS shows default Nginx welcome page: Rebuild frontend image with `docker compose --env-file .env.enterprise -f deploy/enterprise/docker-compose.onprem.yml up -d --build pos-web`.
- API image missing: Run `./deploy/enterprise/start-local.sh` to auto-build missing `simplepos/*` images.

## Helm (Kubernetes)

```bash
helm upgrade --install simple-pos deploy/enterprise/helm/simple-pos \
  --namespace simple-pos \
  --create-namespace
```

For air-gapped environments, pre-load the images into your private registry and override image repositories/tags in chart values.
