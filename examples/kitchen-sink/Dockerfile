FROM node:20.9.0 as builder
WORKDIR /usr/src/app

# Get pnpm installed
#RUN apk add --no-cache curl
RUN curl -fsSL "https://github.com/pnpm/pnpm/releases/download/v8.15.5/pnpm-linuxstatic-x64" -o /bin/pnpm
RUN chmod +x /bin/pnpm
#RUN apk del curl

COPY . .  
RUN pnpm install --prod
RUN pnpm build

FROM builder 
WORKDIR /usr/src/app

COPY --from=builder package.json pnpm-lock.yaml  ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder .twofold ./.twofold
COPY --from=builder public ./public 

EXPOSE 3000
CMD [ "pnpm", "run", "serve" ]