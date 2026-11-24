# Build context is the repository root (see docker-compose.yml).

# ---- Build stage ----
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --workspace client --include-workspace-root=false

COPY client/ client/
RUN npm run build --workspace client

# ---- Runtime stage: Nginx serves the SPA and proxies /api to the server ----
FROM nginx:1.27-alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
