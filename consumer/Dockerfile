FROM node:16

WORKDIR /app

COPY . .

RUN yarn && yarn tsc -b

CMD ["node", "index.js"]
