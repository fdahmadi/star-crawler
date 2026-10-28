# Run guide — Star Crawler (EPSS)

How to run this service locally and with Docker.

What it does:

1. Downloads the latest FIRST EPSS CSV  
2. Upserts all rows into MySQL  
3. Serves an HTTP API to look up one or more CVEs  

Source CSV: https://epss.empiricalsecurity.com/epss_scores-current.csv.gz

---

## Ports and credentials (Docker Compose defaults)

| Service | Host address | Notes |
| --- | --- | --- |
| App / API | `http://localhost:3333` | AdonisJS |
| MySQL | `127.0.0.1:3307` | Mapped from container `3306` |

| Setting | Value |
| --- | --- |
| DB name | `star_crawler` |
| DB user | `star` |
| DB password | `star` |
| Root password | `root` |

---

## Option A — Full Docker (recommended on server)

From the project root:

```bash
cp .env.example .env
# Optional: set APP_KEY to any string >= 32 characters

docker compose up -d --build
```

On first start the app container:

- waits for MySQL to be healthy  
- runs migrations  
- starts the HTTP server  
- with `START_CRON=1` (Compose default) schedules daily sync  

### Manual sync (now)

```bash
docker compose exec app node ace sync:epss
```

### Logs / stop

```bash
docker compose logs -f app
docker compose logs -f mysql
docker compose down
```

---

## Option B — Local Node + Docker MySQL only

Useful for development.

```bash
cp .env.example .env
```

In `.env` for local app + Compose MySQL:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=star
DB_PASSWORD=star
DB_DATABASE=star_crawler
START_CRON=0
```

Then:

```bash
docker compose up -d mysql
npm install
node ace migration:run
node ace sync:epss
npm run dev
```

API: `http://localhost:3333`

---

## Useful commands

```bash
# Sync latest EPSS CSV into MySQL
node ace sync:epss
docker compose exec app node ace sync:epss

# Migrations
node ace migration:run
node ace migration:status

# Dev server
npm run dev

# Production-style (after build)
npm run build
node bin/server.js
```

---

## HTTP API

### Health

```bash
curl http://localhost:3333/
```

### Lookup one or more CVEs (GET)

```bash
curl "http://localhost:3333/epss?cve=CVE-2021-44228"
curl "http://localhost:3333/epss?cve=CVE-2021-44228,CVE-2022-22965"
```

### Lookup (POST JSON)

```bash
curl -X POST http://localhost:3333/epss \
  -H 'content-type: application/json' \
  -d '{"cve":["CVE-2021-44228","CVE-2022-22965"]}'
```

Also accepts:

```json
{ "cve": "CVE-2021-44228,CVE-2022-22965" }
```

### Example response

```json
{
  "total": 2,
  "requested": 2,
  "data": [
    {
      "id": 174124,
      "cve": "CVE-2021-44228",
      "epss": "0.999990000",
      "percentile": "1.000000000",
      "scoreDate": "2026-10-26",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### Stored fields

| Field | Meaning |
| --- | --- |
| `cve` | CVE id |
| `epss` | EPSS score from CSV |
| `percentile` | Percentile from CSV |
| `scoreDate` | Snapshot date from CSV header (`score_date`) |
| `changedAt` | Null until `epss`/`percentile` change; then that sync's `scoreDate` |
| `createdAt` / `updatedAt` | DB timestamps |

---

## Daily schedule

| Env | Default (Compose) | Meaning |
| --- | --- | --- |
| `START_CRON` | `1` | Enable cron inside the app process |
| `EPSS_CRON` | `0 16 * * *` | Run sync every day at 16:00 |
| `TZ` | `Asia/Tehran` | Timezone for the cron |

Local `.env.example` sets `START_CRON=0` so cron does not run during development unless you enable it.

---

## Environment variables

| Variable | Description |
| --- | --- |
| `APP_KEY` | Adonis app key (long random string) |
| `HOST` / `PORT` | HTTP bind address |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_DATABASE` | MySQL connection |
| `START_CRON` | `1` = enable daily sync scheduler |
| `EPSS_CRON` | Cron expression for sync |
| `EPSS_CSV_URL` | FIRST CSV URL |
| `EPSS_CACHE_DIR` | Local cache dir for downloaded `.csv.gz` files |

See `.env.example`.

---

## Typical flows

### First time on a machine

```bash
docker compose up -d --build
docker compose exec app node ace sync:epss
curl "http://localhost:3333/epss?cve=CVE-2021-44228"
```

### Every day afterwards

Either leave Compose running with `START_CRON=1`, or run manually:

```bash
docker compose exec app node ace sync:epss
```
