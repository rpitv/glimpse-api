FROM node:18 AS build

# Initialize environment
CMD ["npm", "run", "start:prod"]
EXPOSE 4000
USER node
WORKDIR /usr/src/app

# Copy package.json files
COPY --chown=node:node ./package*.json .

# Disable Husky
RUN npm pkg delete scripts.prepare

# Install dependencies
RUN npm ci

# Generate Prisma Client
COPY --chown=node:node ./prisma ./prisma
RUN npm run generate

# Build NestJS app
COPY --chown=node:node . .
RUN npm run build

# Delete build-time modules
RUN rm -rf ./node_modules

# Disable Husky (I don't know why this is required twice)
RUN npm pkg delete scripts.prepare

# Install production dependencies and regenerate Prisma client
RUN npm ci --only=production
RUN npm run generate

FROM node:18 AS production

# Initialize environment
CMD ["node", "dist/src/main"]
EXPOSE 4000
USER node
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy built NestJS app from build stage
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist


