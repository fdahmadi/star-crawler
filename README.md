# Star Crawler — EPSS

**Full run guide:** [RUN.md](RUN.md)

AdonisJS service (same stack as `telegram-crawler`) that:

1. Downloads the latest FIRST EPSS CSV
2. Upserts all rows into MySQL
3. Exposes an HTTP API to look up one or more CVEs

## Stack

- AdonisJS 6 + Lucid
- MySQL 8
- `node-schedule` for daily sync
- Docker Compose

## Quick start (Docker)

```bash
cp .env.example .env
# set APP_KEY to any 32+ char string

docker compose up -d --build

# manual sync now
docker compose exec app node ace sync:epss
```

API: `http://localhost:3333`

MySQL on host: `127.0.0.1:3307` (user/pass/db: `star` / `star` / `star_crawler`)

## Local development

```bash
cp .env.example .env
docker compose up -d mysql
npm install
node ace migration:run
node ace sync:epss
npm run dev
```

## API

```bash
# one or many CVEs (query)
curl "http://localhost:3333/epss?cve=CVE-2021-44228,CVE-2022-22965"

# JSON body
curl -X POST http://localhost:3333/epss \
  -H 'content-type: application/json' \
  -d '{"cve":["CVE-2021-44228","CVE-2022-22965"]}'
```

Response fields match the CSV (+ timestamps):

- `cve`
- `epss`
- `percentile`
- `scoreDate` (from CSV header `score_date`)

## Daily schedule

With `START_CRON=1` (default in Compose), the app runs `sync:epss` on `EPSS_CRON` (default `0 16 * * *`, Asia/Tehran).

Manual:

```bash
node ace sync:epss
# or
docker compose exec app node ace sync:epss
```

## Source

https://epss.empiricalsecurity.com/epss_scores-current.csv.gz
