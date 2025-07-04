# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# Start a new stage from a smaller image for the final production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy the built app from the previous stage
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# The command to start the app
CMD ["npm", "start"]
