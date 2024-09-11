FROM node:22.4-alpine

WORKDIR /back

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]