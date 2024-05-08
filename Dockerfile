FROM node:20.9.0-slim as base
WORKDIR /usr/src/twofold
ENV NODE_ENV=production
ENV NODE_OPTIONS="--conditions react-server"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Get pnpm installed
# RUN apk add --no-cache curl
# RUN curl -fsSL "https://github.com/pnpm/pnpm/releases/download/v9.0.6/pnpm-linuxstatic-x64" -o /bin/pnpm
# RUN chmod +x /bin/pnpm
# RUN apk del curl

FROM base AS build
COPY . /usr/src/twofold
WORKDIR /usr/src/twofold
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run --filter=framework compile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm run --filter=website build

FROM base AS website
COPY --from=build /usr/src/twofold /usr/src/twofold
WORKDIR /usr/src/twofold/sites/website
EXPOSE 3000
CMD [ "pnpm", "serve" ]