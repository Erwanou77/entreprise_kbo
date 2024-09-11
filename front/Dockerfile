FROM node:22.4-alpine

WORKDIR /front

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]