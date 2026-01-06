
# Dockerfile for Next.js application
# https://nextjs.org/docs/pages/building-your-application/deploying/docker

# 1. Base Image: Use the official Node.js image.
# ---------------------------------------------
FROM node:18-alpine AS base

# 2. Build Stage: Install dependencies and build the application.
# -------------------------------------------------------------
FROM base AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the Next.js application
RUN npm run build

# 3. Production Stage: Create a lean production image.
# -----------------------------------------------------
FROM base AS production

WORKDIR /app

# Copy built assets from the build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]

