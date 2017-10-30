FROM node

WORKDIR /build

COPY package.json /build/package.json

RUN npm install

COPY . /build/

#CMD ["npm", "start"]