# syntax=docker/dockerfile:1.7

# ---------- 构建 ----------
FROM node:22-alpine AS build
WORKDIR /app

ENV CI=true

# pnpm 版本由 package.json 的 packageManager 字段决定
RUN corepack enable

# 先拷贝依赖清单，命中依赖层缓存；common 需要在 postinstall 里构建，所以一并拷入
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY common ./common
COPY application ./application
COPY main-app/package.json ./main-app/
COPY packages/create-app-dock/package.json ./packages/create-app-dock/
RUN pnpm install --frozen-lockfile

# 再拷源码并构建：BUILD_SCRIPT 可选 build / build:mock / build:supabase
COPY . .
ARG BUILD_SCRIPT=build:mock
RUN pnpm run ${BUILD_SCRIPT}

# ---------- 质量门禁（CI 用，不产出镜像）----------
FROM build AS verify
RUN pnpm run check

# ---------- 生产运行 ----------
FROM nginx:alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/main-app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

# ---------- 可调试运行（dist-debug：不压缩、不混淆、带 sourcemap，仅内网） ----------
FROM nginx:alpine AS debug
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/main-app/dist-debug /usr/share/nginx/html

EXPOSE 80
