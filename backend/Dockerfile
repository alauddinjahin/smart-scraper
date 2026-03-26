# ---- Base stage with system dependencies ----
FROM node:20-slim AS base

# Install Puppeteer system dependencies (including Chromium)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2t64 \
    libpangocairo-1.0-0 libxss1 libgtk-3-0 libxshmfence1 libglu1 chromium \
    && rm -rf /var/lib/apt/lists/*

# Set environment to skip Puppeteer's built-in Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# ---- Build stage (includes dev dependencies) ----
FROM base AS builder

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# ---- Production stage (optional, reduces final image size) ----
FROM base AS production

# Copy node_modules and generated Prisma client from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
