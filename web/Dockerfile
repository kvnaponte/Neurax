FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY web/ web/
RUN pnpm install --frozen-lockfile --filter web...
RUN pnpm --filter web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY web/package.json web/
RUN pnpm install --frozen-lockfile --filter web... --prod
COPY --from=builder /app/web/.next ./web/.next
COPY --from=builder /app/web/public ./web/public
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
