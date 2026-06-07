# Etapa 1: Compilación
FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias y ejecutarlas
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Argumentos de compilación (inyectados por Docker Compose o docker build)
ARG VITE_API_BASE_URL
ARG VITE_BACKEND_URL

# Definir variables de entorno de compilación para Vite
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Compilar frontend para producción
RUN npm run build

# Etapa 2: Servidor Web
FROM nginx:alpine

# Copiar archivos estáticos compilados al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
