# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm nx build pos --configuration=production

FROM nginx:1.27-alpine AS runtime

COPY deploy/enterprise/docker/nginx-pos.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/dist/apps/pos/browser/ /usr/share/nginx/html/

EXPOSE 80
