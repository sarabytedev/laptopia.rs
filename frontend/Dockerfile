# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Build-time arg (Coolify must mark REACT_APP_* as Build Variable)
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL \
    CI=true \
    GENERATE_SOURCEMAP=false \
    DISABLE_ESLINT_PLUGIN=true \
    NODE_OPTIONS=--max_old_space_size=2048

# Alat za rezanje memorije/I/O i osnovne build alatke za native node modules.
RUN apk add --no-cache python3 make g++ git

# Kopiraj samo package.json (yarn.lock možda ne postoji u repou)
COPY package.json yarn.lock* ./

# Skini @emergentbase/visual-edits iz package.json (nedostupan tarball + nepotreban za prod build).
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));if(p.devDependencies && p.devDependencies['@emergentbase/visual-edits']){delete p.devDependencies['@emergentbase/visual-edits'];}if(p.dependencies && p.dependencies['@emergentbase/visual-edits']){delete p.dependencies['@emergentbase/visual-edits'];}fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

# Smanjeni paralelizam da bi yarn install bio stabilniji na malim VPS-ovima.
RUN if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile --network-timeout 600000 --network-concurrency 1; \
    else \
        yarn install --network-timeout 600000 --network-concurrency 1; \
    fi

COPY . .

# Reapply patch posle COPY . . (jer je tek sada povučen originalni package.json iz konteksta).
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));if(p.devDependencies && p.devDependencies['@emergentbase/visual-edits']){delete p.devDependencies['@emergentbase/visual-edits'];}if(p.dependencies && p.dependencies['@emergentbase/visual-edits']){delete p.dependencies['@emergentbase/visual-edits'];}fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

RUN yarn build

# ---------- Stage 2: serve ----------
FROM nginx:1.27-alpine

# SPA + /api proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

# Healthcheck pogađa lokalni /healthz (nezavisan od backenda i SPA fallback-a).
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
