FROM node:11
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --loglevel=error
COPY . .
EXPOSE 9000
CMD node app.js
