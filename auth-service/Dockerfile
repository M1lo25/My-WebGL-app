# auth-service/Dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app

# Copia solo package.json → npm install
COPY package.json ./
RUN npm install --production

# Copia TUTTO il contenuto di auth-service/, inclusa la cartella auth-page/
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
