FROM node
RUN mkdir /usr/src/app
COPY package.json /usr/src/app
WORKDIR /usr/src/app
RUN npm install
COPY index.js /usr/src/app
CMD node index.js 443
