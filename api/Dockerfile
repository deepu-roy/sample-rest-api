FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json .

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create directory for the SQLite database
RUN mkdir -p /app/db

EXPOSE 3000

CMD ["node", "server.js"]
