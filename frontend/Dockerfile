# Use Node.js to build the Next.js app
FROM node:18 AS build

# Set working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the production version of the Next.js app
RUN npm run build

# Only copy production dependencies
RUN npm prune --production

# Use Node.js as the runtime
FROM node:18 AS production

# Set the working directory
WORKDIR /app

# Copy the built application from the previous stage
COPY --from=build /app /app

# Expose port 80
EXPOSE 80

# Start the Next.js server
CMD ["npm", "start"]
