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
RUN pip install piper-tts

# Set working directory
WORKDIR /app

# Install npm dependencies
RUN npm install

# Copy application files
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
