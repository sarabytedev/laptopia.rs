# Deploy na VPS (Coolify) — laptopia.rs

Spisak koraka za deploy aplikacije (FastAPI backend + React frontend + MongoDB) na VPS preko Coolify.

## 1. Lokalna priprema (već urađeno u repou)

1. `backend/Dockerfile` — image za FastAPI (uvicorn, port 8001).
2. `backend/.dockerignore` — isključuje `__pycache__`, `.env`, `venv`, testove.
3. `frontend/Dockerfile` — multi-stage build (Node 20 build → nginx serve), port 80.
4. `frontend/nginx.conf` — SPA fallback (`try_files ... /index.html`) + proxy `/api` na backend.
5. `frontend/.dockerignore` — isključuje `node_modules`, `build`, `.env`.
6. `docker-compose.yml` (root) — orkestracija servisa `backend`, `frontend`, `mongo` sa healthcheck-ovima i mrežom.
7. `backend/.env.example` i `frontend/.env.example` — template promenljivih.

## 2. Git push

```bash
git add Dockerfile* docker-compose.yml backend/Dockerfile backend/.dockerignore \
        frontend/Dockerfile frontend/.dockerignore frontend/nginx.conf \
        backend/.env.example frontend/.env.example DEPLOY_STEPS.md
git commit -m "chore: Coolify/Docker deployment setup"
git push origin main
```

## 3. Coolify — kreiranje projekta

1. Uloguj se na Coolify (`https://coolify.tvoj-vps`).
2. **Projects → New Project** → naziv `laptopia-rs`.
3. **+ Add Resource → Application → Public/Private Repository**.
4. Repo URL: `https://github.com/<user>/laptopia.rs` (ako je private, dodaj GitHub App ili deploy key).
5. Branch: `main`.
6. Build Pack: **Docker Compose**.
7. Docker Compose Location: `/docker-compose.yml`.

## 4. Environment varijable (Coolify → Environment)

Backend:
- `MONGO_URL=mongodb://mongo:27017`
- `DB_NAME=laptopia`
- `CORS_ORIGINS=https://laptopia.rs,https://www.laptopia.rs`

Frontend (build-time — moraju biti `Build Variable`):
- `REACT_APP_BACKEND_URL=https://laptopia.rs`

Mongo:
- `MONGO_INITDB_ROOT_USERNAME` (opciono, ako uključiš auth)
- `MONGO_INITDB_ROOT_PASSWORD` (opciono)

## 5. Domeni i SSL

1. U Coolify-ju za `frontend` servis: **Domains** → `https://laptopia.rs` (i `https://www.laptopia.rs`).
2. DNS A record kod registrara → IP VPS-a.
3. Coolify automatski izdaje Let's Encrypt sertifikat (Traefik proxy).
4. Za backend (ako želiš direktan pristup): `https://api.laptopia.rs` → backend servis port 8001.

## 6. Persistent volume za Mongo

U Coolify → Storage → dodaj volume:
- Name: `mongo-data`
- Source: named volume
- Destination: `/data/db` (mapirano na `mongo` servis)

## 7. Prvi deploy

1. **Deploy** dugme u Coolify.
2. Prati logove (Build → Container).
3. Health check: `https://laptopia.rs/api/` treba da vrati `{"message":"Hello World"}`.
4. Frontend root: `https://laptopia.rs` treba da renderuje hero sekciju.

## 8. Post-deploy provere

- `curl -fsS https://laptopia.rs/api/` → JSON odgovor.
- `curl -fsS https://laptopia.rs/` → HTML (index).
- Mongo konekcija: u backend logovima nema `ServerSelectionTimeoutError`.
- TLS: `curl -vI https://laptopia.rs 2>&1 | grep -i "subject\|issuer"`.

## 9. Auto-deploy (CI)

1. Coolify → Application → **Webhooks** → kopiraj GitHub webhook URL.
2. Dodaj u GitHub repo → Settings → Webhooks (push event).
3. Svaki push na `main` pokreće rebuild.

## 10. Backup & monitoring

1. Coolify → Backups → schedule za `mongo` volume (dnevno, retencija 7 dana).
2. Coolify → Notifications → Discord/Email za failed deploy.
3. Resource limits: za `mongo` servis postavi `mem_limit: 512m`.
