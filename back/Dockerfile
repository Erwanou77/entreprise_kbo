FROM node:22.8-alpine

WORKDIR /back

COPY package*.json ./

RUN npm install

EXPOSE 3000

CMD npm run dev && tail -F /dev/null