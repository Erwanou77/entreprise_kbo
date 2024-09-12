FROM node:20.17.0-alpine


WORKDIR /front

COPY package*.json ./

RUN npm install

EXPOSE 5000

CMD ["npx","expo","start"]