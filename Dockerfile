FROM node
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm ci
CMD node index.js 443
