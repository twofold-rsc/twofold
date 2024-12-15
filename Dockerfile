FROM node:20.9.0-slim AS base
WORKDIR /usr/src/twofold
ENV NODE_ENV=production
ENV NODE_OPTIONS="--conditions react-server"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


FROM base AS build
COPY . /usr/src/twofold
WORKDIR /usr/src/twofold
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter="@twofold/framework..." --prod=false --frozen-lockfile
RUN pnpm run --filter="@twofold/framework..." compile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter="website..." --prod=false --frozen-lockfile
RUN pnpm run --filter=website build


FROM base AS website
COPY --from=build /usr/src/twofold /usr/src/twofold
WORKDIR /usr/src/twofold/sites/website
EXPOSE 3000
CMD [ "pnpm", "serve" ]