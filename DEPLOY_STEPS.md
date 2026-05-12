# Deploy na VPS (Coolify) — laptopia.rs

Spisak koraka za deploy aplikacije (FastAPI backend + React frontend + MongoDB) na VPS preko Coolify.

## 1. Lokalna priprema (već urađeno u repou)

1. `backend/Dockerfile` — image za FastAPI (uvicorn, port 8001).
2. `backend/requirements.prod.txt` — production deps **bez** `emergentintegrations` (private PyPI) i dev alata (pytest/black/mypy). Dockerfile koristi ovaj fajl.
3. `backend/.dockerignore` — isključuje `__pycache__`, `.env`, `venv`, testove.
4. `frontend/Dockerfile` — multi-stage build (Node 20 build → nginx serve), port 80.
5. `frontend/nginx.conf` — SPA fallback (`try_files ... /index.html`) + proxy `/api` na backend.
6. `frontend/.dockerignore` — isključuje `node_modules`, `build`, `.env`.
7. `docker-compose.yml` (root) — orkestracija servisa `backend`, `frontend`, `mongo` sa healthcheck-ovima i mrežom.
8. `backend/.env.example` i `frontend/.env.example` — template promenljivih.

> **Napomena o `requirements.txt`:** original `backend/requirements.txt` (sa `emergentintegrations==0.1.0`) ostaje za lokalni/Emergent dev. Production build koristi `requirements.prod.txt` jer `emergentintegrations` ne postoji na javnom PyPI (private index emergent.sh) i ruši build u Coolify-ju.

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

## 5. DNS kod provajdera (registrar / DNS provider)

Pre nego što Coolify može da izda Let's Encrypt sertifikat, DNS mora da pokazuje na IP VPS-a. `laptopia.rs` je `.rs` domen (RNIDS), tako da je registrar verovatno **mCloud / Loopia / Webtech / RNIDS partner**. Logika je ista bez obzira na provajdera.

### 5.1. Pronađi IP VPS-a

Na VPS-u:
```bash
curl -fsS https://api.ipify.org && echo
# ili
ip -4 addr show | grep -oP 'inet \K[\d.]+' | grep -v '^127\|^10\.\|^172\.\|^192\.168'
```
Sačuvaj IPv4 (npr. `185.xxx.xxx.xxx`). Ako VPS ima i IPv6, sačuvaj i njega (`curl -6 https://api64.ipify.org`).

### 5.2. Otvori DNS zone editor

1. Uloguj se kod registrara (RNIDS preko provajdera, npr. mCloud/Loopia/Webtech).
2. **Domains → laptopia.rs → DNS** (ili **DNS Management / Zone Editor / Napredna DNS podešavanja**).
3. Ako si do sada koristio default name-servere registrara, sve je u redu. Ako koristiš Cloudflare, vidi 5.6.

### 5.3. Obriši/proveri postojeće zapise

Pre dodavanja novih, **obriši stare A/AAAA/CNAME** zapise koji pokazuju na pogrešno mesto (parking stranica, stari hosting). Sačuvaj postojeće **MX** i **TXT (SPF/DKIM/DMARC)** ako koristiš email — njih NE diraj.

### 5.4. Dodaj zapise

| Type  | Host / Name          | Value / Target        | TTL  | Napomena                          |
|-------|----------------------|-----------------------|------|------------------------------------|
| A     | `@` (ili `laptopia.rs`) | `IP_VPS_a`           | 300  | Apex domen → VPS                   |
| A     | `www`                | `IP_VPS_a`            | 300  | `www.laptopia.rs` → VPS            |
| A     | `api` (opciono)      | `IP_VPS_a`            | 300  | Samo ako želiš `api.laptopia.rs`   |
| AAAA  | `@`                  | `IPv6_VPS_a`          | 300  | Opciono, ako VPS ima IPv6          |
| AAAA  | `www`                | `IPv6_VPS_a`          | 300  | Opciono                            |
| CAA   | `@`                  | `0 issue "letsencrypt.org"` | 300 | Eksplicitno dozvoli LE za TLS |

> Napomene:
> - **TTL 300s (5 min)** dok testiraš. Posle stabilizacije možeš podići na 3600.
> - Neki provajderi za apex (`@`) imaju samo polje "Host" prazno ili `laptopia.rs.` (sa tačkom na kraju).
> - **Nemoj** kreirati CNAME za apex `@` (to nije validno za `.rs`); koristi A zapis.
> - `www` može biti CNAME na `laptopia.rs.` ako provajder podržava, ali A zapis je sigurniji.

### 5.5. Sačuvaj i sačekaj propagaciju

DNS propagacija obično traje 5–30 min za `.rs` (zavisi od TTL-a i registrara). Proveri:

```bash
# Iz lokala
dig +short laptopia.rs A
dig +short www.laptopia.rs A
dig +short laptopia.rs CAA

# Public resolveri (zaobiđu lokalni cache)
dig +short laptopia.rs @1.1.1.1
dig +short laptopia.rs @8.8.8.8

# Globalna provera (browser):
# https://dnschecker.org/#A/laptopia.rs
```
Svi treba da vraćaju IP VPS-a.

### 5.6. Ako koristiš Cloudflare (opciono)

Ako delegiraš `laptopia.rs` na Cloudflare name-servere:
1. Kreiraj iste A/AAAA zapise u Cloudflare DNS.
2. **Proxy status: DNS only (siva oblačić)** dok Coolify ne izda LE sertifikat. Kasnije možeš uključiti proxy (narandžasti).
3. SSL/TLS mode: **Full (strict)**, ne "Flexible" (uzrokuje redirect petlju).
4. Kod registrara `.rs` postavi Cloudflare NS umesto default-a (`*.ns.cloudflare.com`).

### 5.7. Dodaj domene u Coolify

1. Coolify → Application → `frontend` servis → **Domains**.
2. Dodaj:
   - `https://laptopia.rs`
   - `https://www.laptopia.rs`
3. (Opciono) za backend servis: `https://api.laptopia.rs` (port `8001`).
4. **Save → Redeploy** (ili **Reload Proxy**) — Traefik automatski povlači Let's Encrypt sertifikat.
5. U logovima proxy-ja ne sme da bude `acme: error` ili `unable to authorize`. Ako jeste — DNS još nije propagiran ili CAA blokira LE.

### 5.8. Force HTTPS i www → apex redirect

U Coolify domain config-u uključi:
- **Force HTTPS** (HTTP → HTTPS 301).
- **Redirect www to non-www** (ili obratno, izaberi kanon URL). Ako želiš `https://laptopia.rs` kao primarni, dodaj `www.laptopia.rs` kao alijas sa redirect-om.

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

## 11. Troubleshooting build problema

### A) Backend pip install pada (`emergentintegrations`)
- Uzrok: paket je sa Emergent privatnog PyPI-ja, ne sa javnog.
- Fix: `backend/Dockerfile` koristi `requirements.prod.txt` koji **ne** sadrži `emergentintegrations` ni dev alate.

### B) Frontend build pada sa `exit code 255` (često OOM)
- Uzrok: CRA + react-scripts + radix paketi tokom `yarn install` i `yarn build` lako pređu 1GB RAM-a. Na VPS-u sa <= 2GB to obara docker build.
- Fix (već primenjen u `frontend/Dockerfile`):
  - `NODE_OPTIONS=--max_old_space_size=2048`
  - `GENERATE_SOURCEMAP=false`
  - `DISABLE_ESLINT_PLUGIN=true`
  - `yarn install --network-concurrency 1`
  - Skidanje `@emergentbase/visual-edits` (tarball sa emergent.sh) iz `package.json` u build koraku — nije potreban za prod, a tarball ume da bude nedostupan iz VPS mreže.
- Ako i dalje puca:
  - Proveri RAM na VPS-u: `free -h`. Privremeno dodaj swap:
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile && sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    ```
  - Alternativa: build frontend lokalno (`yarn build`), commit-uj `frontend/build/` i izmeni Dockerfile da samo kopira `build/` u nginx (bez build stage-a).

### C) Mongo healthcheck `mongosh: command not found`
- Stari `mongo:5` image nema `mongosh`. `mongo:7` ima. Compose koristi `mongo:7`.

### D) Coolify ne može da povuče Let's Encrypt sertifikat
- `dig +short laptopia.rs` mora vratiti IP VPS-a sa interneta.
- CAA zapis sme da bude prazan ili `0 issue "letsencrypt.org"`.
- Port 80 i 443 moraju biti otvoreni na firewall-u VPS-a (`ufw status`).
