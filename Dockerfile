FROM node

# 复制文件到工作目录
WORKDIR /app
COPY . .

# 安装依赖，编译TypeScript
RUN npm -g install pnpm && pnpm install && npx tsc

# 暴露文件目录
VOLUME [ "/app/config" ]

CMD ["node", "./dist/main.js"]