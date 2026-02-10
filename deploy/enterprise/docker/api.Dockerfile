# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY . .

# Prisma config requires DATABASE_URL even for client generation during image build.
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/simple_pos?schema=public

RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate
RUN pnpm nx build api

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/dist/apps/api ./
COPY --from=builder /workspace/prisma.config.ts ./prisma.config.ts
COPY --from=builder /workspace/apps/api/prisma ./apps/api/prisma
COPY deploy/enterprise/docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh

RUN chmod +x /usr/local/bin/api-entrypoint.sh

EXPOSE 3000

CMD ["api-entrypoint.sh"]
