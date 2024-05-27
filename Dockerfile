# Base image
FROM zenika/alpine-chrome:with-puppeteer

# Create app directory
WORKDIR /usr/src/app

# Switch to 'chrome' user before copying and installing
USER chrome

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY --chown=chrome:chrome package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY --chown=chrome:chrome . .

# Copy the .env and .env.development files
COPY .env .env.development ./

# Creates a "dist" folder with the production build
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Start the server using the production build
CMD ["npm", "run", "start:prod"]