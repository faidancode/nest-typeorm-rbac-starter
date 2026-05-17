FROM node:22-bookworm-slim AS base

WORKDIR /usr/src/app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

FROM base AS build

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --dangerously-allow-all-builds

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
