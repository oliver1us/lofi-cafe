# syntax=docker/dockerfile:1.7

# Multi-architecture digests verified on 2026-11-09. Update them regularly for security fixes.
ARG BUILD_IMAGE=node:24-trixie-slim@sha256:0820eaa85e07d0490446dd01d14707e17e6108a36988cf374899cd057eb3812d
ARG RUNTIME_IMAGE=gcr.io/distroless/nodejs24-debian13:nonroot@sha256:088a01637f22908632ba09018be2e0b516f2fa6f7869c191d29491139db43c78

FROM ${BUILD_IMAGE} AS base
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./

FROM base AS build-dependencies
# No dependency lifecycle scripts. esbuild uses its platform-specific optional package.
RUN --mount=type=cache,id=lofi-cafe-npm,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci --include=dev --ignore-scripts --no-audit --no-fund

FROM build-dependencies AS build
COPY --chown=node:node index.html tsconfig.json vite.config.ts ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node public/ ./public/
# Vite imports the local presence plugin; the server is not run during the build.
COPY --chown=node:node server/ ./server/
RUN npm run build

FROM base AS production-dependencies
ENV NODE_ENV=production
RUN --mount=type=cache,id=lofi-cafe-npm,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM ${RUNTIME_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    NODE_OPTIONS=--max-old-space-size=128

# Root-owned application files cannot be modified by the runtime user, even without Compose.
COPY --from=production-dependencies --chown=0:0 /app/node_modules ./node_modules
COPY --from=build --chown=0:0 /app/dist ./dist
COPY --from=build --chown=0:0 /app/server ./server
COPY --chown=0:0 package.json ./package.json

USER 65532:65532
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["/nodejs/bin/node", "server/healthcheck.mjs"]
ENTRYPOINT ["/nodejs/bin/node"]
CMD ["server/index.mjs"]
