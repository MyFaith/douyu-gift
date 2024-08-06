FROM node:16

# 复制文件到工作目录
WORKDIR /app
COPY . .

# 安装依赖，编译TypeScript
RUN npm install && \
    npx tsc && \
    npx puppeteer browsers install chrome && \
    mkdir /app/config && \
    touch /app/config/cookie.txt && \
    touch /app/config/pushkey.txt

# 暴露文件目录
VOLUME [ "/app/config" ]

CMD ["node", "./dist/main.js"]