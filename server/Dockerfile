FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy prisma schema first to generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3001

# The start script should run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
