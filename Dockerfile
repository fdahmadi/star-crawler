ARG NODE_IMAGE=node:22-alpine
FROM $NODE_IMAGE AS base
RUN apk --no-cache add dumb-init tzdata
ENV TZ=Asia/Tehran
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
WORKDIR /home/node/app
RUN mkdir -p tmp/epss-cache && chown -R node:node /home/node/app

FROM base AS dependencies
COPY package.json ./
RUN npm install
COPY . .

FROM dependencies AS build
ENV NODE_ENV=production
RUN node ace build

FROM base AS production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /home/node/app/build .
COPY --from=dependencies /home/node/app/database ./database
USER node
EXPOSE 3333
CMD ["dumb-init", "sh", "-c", "node ace migration:run --force && node bin/server.js"]
