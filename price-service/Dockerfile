# --- builder: install all deps, compile TS, prune to prod ---
FROM docker.arvancloud.ir/node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

# --- runtime: copy compiled output + production deps only ---
FROM docker.arvancloud.ir/node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# tsc emits .js only; copy the SQL migrations next to the compiled migrate.js
COPY --from=builder /app/src/db/migrations ./dist/db/migrations

RUN mkdir -p data
EXPOSE 4000
CMD ["node", "dist/server.js"]
