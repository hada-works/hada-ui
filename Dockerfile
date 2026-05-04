# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM node:22.22.2-alpine3.22 AS builder

WORKDIR /app

ENV CI=true

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
RUN npm run build

# ---------- Runtime stage (unprivileged) ----------
FROM nginxinc/nginx-unprivileged:1.30.0-alpine AS runner

USER root
RUN apk upgrade --no-cache \
    && rm -rf /usr/share/nginx/html/* \
    && rm /etc/nginx/conf.d/default.conf
USER 101

COPY --chown=101:101 .build/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
