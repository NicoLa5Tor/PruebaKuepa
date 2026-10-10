FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite embebe estas variables en el bundle en tiempo de build
ARG VITE_API_URL=http://localhost:7001
ARG VITE_PUBLIC_URL=http://localhost:7001
ARG VITE_LOGTO_ENDPOINT
ARG VITE_LOGTO_APP_ID
ENV VITE_API_URL=$VITE_API_URL \
    VITE_PUBLIC_URL=$VITE_PUBLIC_URL \
    VITE_LOGTO_ENDPOINT=$VITE_LOGTO_ENDPOINT \
    VITE_LOGTO_APP_ID=$VITE_LOGTO_APP_ID

RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
