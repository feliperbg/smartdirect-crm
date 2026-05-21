FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --include=dev

COPY . .

RUN npm run build

RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node", "dist/main.js"]
