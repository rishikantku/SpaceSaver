# SpaceSaver - Docker Development Environment
# 
# This Dockerfile sets up a development environment for SpaceSaver.
# Note: The actual macOS app requires macOS + Xcode to run.
# Docker is used for development, testing, and validation.
#
# Build: docker build -t spacesaver .
# Run:   docker run -it spacesaver
# Test:  docker run spacesaver npm test

FROM node:20-alpine

# Install git and other dependencies
RUN apk add --no-cache git bash curl

# Set working directory
WORKDIR /app

# Clone the repository
RUN git clone https://github.com/rishikantku/SpaceSaver.git . || true

# If running from local context (not cloning), copy files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files (if building from local context)
COPY . .

# Run validation
RUN npm run typecheck || true
RUN npm run lint || true

# Default command - run tests
CMD ["npm", "test"]

# Alternative commands:
# Interactive shell: docker run -it spacesaver /bin/bash
# Watch mode: docker run -it spacesaver npm run start
# Validation: docker run spacesaver npm run validate
