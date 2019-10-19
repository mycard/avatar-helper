FROM node:12.12.0-buster-slim
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm ci
CMD node index.js 443
