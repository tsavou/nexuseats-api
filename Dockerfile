# ============================================
# Stage 1 — Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install ALL dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 2. Generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copy source code and build
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# 4. Prune dev dependencies (keep only production, keep Prisma generated client)
RUN npm prune --omit=dev --legacy-peer-deps

# ============================================
# Stage 2 — Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application and stripped node_modules in single layers
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Security: run as non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
