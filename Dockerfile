FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN mkdir -p .tools/node/bin && ln -s "$(command -v node)" .tools/node/bin/node

COPY package*.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Jakarta
ENV NEXT_TELEMETRY_DISABLED=1
ENV SQLITE_PATH=/data/activity.sqlite
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV APP_INTERNAL_ORIGIN=http://127.0.0.1:3000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "server.js"]
