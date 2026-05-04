# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM node:22.22.2-alpine3.22 AS builder

WORKDIR /app

ENV CI=true \
    NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27.5-alpine AS runner

RUN rm -rf /usr/share/nginx/html/* \
    && rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
