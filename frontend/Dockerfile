FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .

# Declare build-time arg so Vite can embed the API URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
