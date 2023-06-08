FROM node:16.17.0-bullseye-slim AS base
WORKDIR /usr/src/app
# THIS IS TO ENABLE PRISMA TO DETECT REQUIRED FILES
RUN apt-get update && apt-get install -y openssl libssl-dev

FROM base AS build
COPY ./package.json ./yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn prisma:generate && yarn build

FROM base AS production
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/yarn.lock ./yarn.lock
COPY --from=build /usr/src/app/prisma ./prisma
# COPY --from=build /usr/src/app/.env ./.env

CMD ["yarn","start:prod"]