# Hostinger Cats VPS Deployment

This deployment creates an isolated `cats-mahosample` Docker Compose project on VPS `1970019`.

## Isolation

- Containers use the `cats-mahosample-*` prefix.
- PostgreSQL data uses the dedicated `cats_mahosample_postgres_data` volume.
- Application traffic uses the dedicated `cats_mahosample_internal` network.
- No host ports are published. The existing Hostinger Traefik project discovers the app through Docker labels.
- Existing `cats-wordpress`, `cats-mail`, `hermes-agent-ddep`, and `traefik` projects are not changed.

## Hostname

The production hostname is `sample.cats.co.th`. Add an A record at the authoritative DNS provider:

| Type | Name | Value |
| --- | --- | --- |
| A | sample | 187.53.137.160 |

The authoritative nameservers for `cats.co.th` are currently `ns257.pathosting.com` and `ns258.pathosting.com`, so this record is not managed by the Hostinger account API.

## Deploy With Hostinger CLI

Validate the file locally before deployment:

```powershell
docker compose --env-file .env.production -f docker-compose.yml config --quiet
```

The images are published by `.github/workflows/publish-images.yml` to GitHub Container Registry. Create the project using Hostinger CLI after both images are available:

```powershell
hostinger vps docker create 1970019 `
  --project-name cats-mahosample `
  --content (Get-Content -Raw docker-compose.yml) `
  --environment (Get-Content -Raw .env.production)
```

Never commit `.env.production` or database backups.
