FROM node:16.16-slim As development

WORKDIR /usr/src/app

COPY ./package.json ./yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

FROM node:16.16-slim as production

WORKDIR /usr/src/app

EXPOSE 8000

COPY --from=development /usr/src/app .

# THIS IS TO ENABLE PRISMA DO DETECT REQUIRED FILES
RUN apt-get update && apt-get install -y openssl libssl-dev

CMD ["yarn","start:prod"]