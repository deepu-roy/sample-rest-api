FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json .

# Install dependencies
RUN npm install

# Copy app source (excluding node_modules to avoid conflicts)
COPY . .

# Rebuild native modules for the current architecture
RUN npm rebuild sqlite3

# Create directory for the SQLite database
RUN mkdir -p /app/db

EXPOSE 3000

CMD ["node", "server.js"]
