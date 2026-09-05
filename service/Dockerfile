FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY service ./service
RUN npm run build:service

FROM node:22-alpine
ARG BUILD_SHA=dev
ARG GIT_SHA=dev
WORKDIR /app
ENV NODE_ENV=production
ENV BUILD_SHA=${BUILD_SHA}
RUN addgroup -S roomcode && adduser -S roomcode -G roomcode && mkdir -p /app/data && chown -R roomcode:roomcode /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/service/dist ./service/dist
USER roomcode
EXPOSE 8080
CMD ["node", "service/dist/index.js"]
