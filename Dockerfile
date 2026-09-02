# Build stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* vars are optional at build time. Leave VITE_API_URL unset for Railway
# so the deployed app talks to the same origin API server.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Runtime stage — API + static files
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server ./server

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npx", "tsx", "server/production.ts"]
