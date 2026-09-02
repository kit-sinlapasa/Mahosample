# Hostinger VPS Deploy

This deploy path keeps Mahosample isolated from existing Docker applications on the VPS.

## Safety Rules

- Do not stop, remove, or rename existing containers.
- Do not reuse existing Docker networks or volumes.
- Keep every Mahosample resource prefixed with `mahosample`.
- Start on port `18080` first so the stack does not conflict with an existing Traefik service on ports `80` and `443`.
- Only connect `maho.kitaith.com` after the Mahosample stack is healthy.

## Resources Created

- Containers:
  - `mahosample-prod-postgres`
  - `mahosample-prod-api`
  - `mahosample-prod-frontend`
  - `mahosample-prod-proxy`
- Network:
  - `mahosample_prod_internal`
- Volumes:
  - `mahosample_prod_postgres_data`
  - `mahosample_prod_caddy_data`
  - `mahosample_prod_caddy_config`

## First Deploy

On the VPS:

```sh
sudo mkdir -p /opt
cd /opt
sudo git clone https://github.com/kit-sinlapasa/Mahosample.git mahosample
sudo chown -R "$USER":"$USER" /opt/mahosample
cd /opt/mahosample/deploy/hostinger
cp .env.production.example .env.production
```

Edit `deploy/hostinger/.env.production` and set real values:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `PUBLIC_APP_URL=https://maho.kitaith.com`
- `MAHOSAMPLE_HOST=maho.kitaith.com`
- `VITE_API_BASE_URL=` stays blank when the frontend and API are served from the same domain.

Then run:

```sh
cd /opt/mahosample/deploy/hostinger
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Test before DNS routing:

```sh
curl http://127.0.0.1:18080/api/health
```

## DNS

In Hostinger DNS for `kitaith.com`, add this record after the stack is healthy:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | maho | VPS IPv4 address | default |

Do not delete existing records for `@`, `www`, or `line`.

## Domain Routing

The safe default proxy listens on host port `18080`. The proxy container also has Traefik labels for Hostinger's existing Traefik service:

- Host: `maho.kitaith.com`
- Entry point: `websecure`
- Certificate resolver: `letsencrypt`
- Service port: `8080`

If Traefik is not present, keep using `http://<server-ip>:18080` or configure a direct HTTPS proxy after inspecting the current VPS.

## Update Deploy

After changes are merged to `main`:

```sh
cd /opt/mahosample
sh deploy/hostinger/deploy.sh
```

## Backup

Create a database backup:

```sh
docker exec mahosample-prod-postgres pg_dump -U mahosample mahosample > mahosample-backup.sql
```

Restore requires stopping the app and should be done carefully from a verified backup.
