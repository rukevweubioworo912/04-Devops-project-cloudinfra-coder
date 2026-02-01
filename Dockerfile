# =====================
# Stage 1: Build Stage
# =====================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Accept API key as build argument (optional, mostly for Vite build)
ARG VITE_API_KEY
ENV VITE_API_KEY=${VITE_API_KEY}

# Build the app
RUN npm run build

# =====================
# Stage 2: Production Stage
# =====================
FROM node:20-alpine AS production

WORKDIR /app

# Install serve and gettext (for envsubst)
RUN npm install -g serve && apk add --no-cache gettext

# Copy the built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public/config.template.js ./config.template.js

# Expose the port
EXPOSE 3000

# =====================
# Runtime entrypoint
# =====================
# This will inject the API key into config.js at container startup
# and then start the server
CMD sh -c "if [ -z \"$VITE_API_KEY\" ]; then echo 'ERROR: VITE_API_KEY not set'; exit 1; fi && \
    envsubst < config.template.js > dist/config.js && \
    serve -s dist -l 3000"
