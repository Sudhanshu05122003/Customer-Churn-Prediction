# Dockerfile for Next.js Frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build the Next.js app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy build artifacts and package configs
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

EXPOSE 3000

# Start next server
CMD ["npm", "run", "start"]
