FROM node:16
RUN mkdir -p /usr/src/next-website/apiv6
WORKDIR /usr/src/next-website/apiv6
COPY . .
RUN yarn cache clean && yarn --update-checksums

EXPOSE 3005

CMD ["yarn", "start"]