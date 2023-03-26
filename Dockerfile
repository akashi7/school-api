FROM node:16.17.0-bullseye-slim As development

WORKDIR /usr/src/app

# THIS IS TO ENABLE PRISMA DO DETECT REQUIRED FILES
RUN apt-get update && apt-get install -y openssl libssl-dev
COPY ./package.json ./yarn.lock ./
RUN yarn install
COPY . .
RUN yarn prisma:generate
RUN yarn build

CMD ["yarn","start:prod"]