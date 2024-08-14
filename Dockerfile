# Use the official Node.js image as the base image for building the application
FROM node:18 AS build

# Set the working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Copy email templates to the dist folder
RUN npm run copy-templates

# Use a lighter image for running the application
FROM node:18-slim

# Set the working directory
WORKDIR /usr/src/app

# Install ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy only the necessary files from the build stage
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/dist ./dist

# Install production dependencies
RUN npm install --only=production

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the app
CMD ["node", "dist/src/main.js"]