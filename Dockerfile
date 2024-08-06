FROM node

# 安装依赖，编译TypeScript
RUN npm install && \
  npx tsc &&

# 复制文件到工作目录
WORKDIR /app
COPY ./dist .

# 暴露文件目录
VOLUME [ "/app/config" ]

CMD ["node", "main.js"]