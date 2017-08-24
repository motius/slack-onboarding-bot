FROM node

COPY package.json /build/package.json

WORKDIR /build

RUN npm install

COPY . /build/

CMD ["nodemon", "server.js"]
