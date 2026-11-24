# Build context is the repository root (see docker-compose.yml), so the
# workspace lockfile is used and installs are reproducible.

# ---- Build stage ----
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --workspace server --include-workspace-root=false

COPY server/ server/
RUN npm run build --workspace server

# ---- Runtime stage ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5001 \
    DB_PATH=/app/data/presight.db

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --workspace server --include-workspace-root=false --omit=dev && npm cache clean --force

COPY --from=builder /app/server/dist server/dist

# The data folder belongs to the unprivileged "node" user so the named volume is writable.
RUN mkdir -p /app/data && chown node:node /app/data
USER node

WORKDIR /app/server
EXPOSE 5001
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
