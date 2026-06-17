FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY backend/ backend/
RUN pnpm install --frozen-lockfile --filter backend...
RUN pnpm --filter backend build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter backend... --prod
COPY --from=builder /app/backend/dist ./backend/dist
EXPOSE 3001
CMD ["node", "backend/dist/app.js"]
