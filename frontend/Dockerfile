# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Build-time arg (Coolify must mark REACT_APP_* as Build Variable)
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Install deps with yarn (frontend uses yarn per package.json)
COPY package.json yarn.lock* ./
RUN if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile --network-timeout 600000; \
    else \
        yarn install --network-timeout 600000; \
    fi

COPY . .

RUN yarn build

# ---------- Stage 2: serve ----------
FROM nginx:1.27-alpine

# SPA + /api proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
