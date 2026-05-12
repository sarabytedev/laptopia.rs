# Frontend deploy = SAMO nginx koji serve-uje pre-built statičke fajlove.
# Build (yarn install + yarn build) radi se LOKALNO na dev mašini pre git push-a,
# jer mali VPS-ovi obore Webpack/CRA build (OOM, exit 255).
#
# Pre svakog push-a, sa dev mašine:
#   cd frontend
#   REACT_APP_BACKEND_URL=https://laptopia.rs yarn build
#   git add build && git commit -m "build: frontend" && git push

FROM nginx:1.27-alpine

# SPA + /api proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Pre-built statički sajt
COPY build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
