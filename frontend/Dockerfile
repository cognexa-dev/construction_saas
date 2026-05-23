FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
CMD ["sh", "-c", "printf 'window.__ENV={VITE_API_BASE_URL:\"%s\"};' \"${VITE_API_BASE_URL:-}\" > /app/dist/env.js && serve -s dist -l ${PORT:-3000}"]
