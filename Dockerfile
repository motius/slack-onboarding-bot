FROM node

COPY package.json /build/package.json

WORKDIR /build

RUN npm install -g

COPY . /build/

CMD ["npm", "start"]
