FROM node:20
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile
COPY index.js ./
CMD ["node", "index.js"]