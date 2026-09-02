# Build stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* vars must be set as Railway build-time variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Runtime stage — serve static files (no Caddy)
FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve@14.2.4

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 8080

CMD ["sh", "-c", "serve dist -s -l tcp://0.0.0.0:${PORT:-8080}"]
