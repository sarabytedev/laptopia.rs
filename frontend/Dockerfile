# Multi-stage build: Node image kompajlira React app, nginx image samo servira.
# Build se sada radi u kontejneru (Coolify radi sve), ne lokalno pre push-a.
#
# Memory tuning: GENERATE_SOURCEMAP=false i max-old-space-size=1024 obaraju peak
# RAM na ~700MB što staje na sve standardne VPS-ove.

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app

# Cache layer: zavisnosti se ne reinstaliraju ako se manifest nije menjao.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY . .

ARG REACT_APP_BACKEND_URL=https://laptopia.rs
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=1024
RUN yarn build

# ---------- Stage 2: nginx ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
