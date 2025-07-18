# Use official Node.js runtime as base image
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Piper TTS
RUN pip install piper-tts --break-system-packages

# Set working directory
WORKDIR /app

# Copy package files first
COPY ./package*.json ./
RUN npm i

COPY . .

# Create necessary directories
RUN mkdir -p models audio

# Expose port
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Start the application
CMD ["npm", "start"]
