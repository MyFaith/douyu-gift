FROM node

# 复制文件到工作目录
WORKDIR /app
COPY . .

# 安装Chrome支持库
RUN apt-get update && apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2 libpangocairo-1.0-0 libxss1 libgtk-3-0

# 安装依赖，编译TypeScript
RUN npm install && \
    node ./node_modules/puppeteer/install.mjs && \
    npx tsc

# 创建配置文件
RUN mkdir /app/config && \
    touch /app/config/cookie.txt && \
    touch /app/config/pushkey.txt
    

# 暴露文件目录
VOLUME [ "/app/config" ]

CMD ["node", "./dist/main.js"]