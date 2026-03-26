FROM node:20-slim

# Install system dependencies for Puppeteer (Debian Bookworm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxss1 \
    libgtk-3-0 \
    libxshmfence1 \
    libglu1-mesa \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Skip Puppeteer's own Chromium download and use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files and Prisma schema first (so we can generate client)
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies, but skip the postinstall script (we'll generate manually)
RUN npm install --omit=optional --ignore-scripts

# Generate Prisma client (requires the schema we just copied)
RUN npx prisma generate

# Copy the rest of the application source
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Start the app, but first run database migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
