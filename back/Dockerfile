FROM node:18-alpine

# server.ts sube de directorio hasta que el cwd termine en "back"
WORKDIR /app/back

# puppeteer está en dependencias pero no se usa: evitamos descargar Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 7001
CMD ["npm", "run", "dev"]
