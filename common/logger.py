import time

from loguru import logger
from common.dirs import *

class Logger:
    __instance = None

    def __new__(cls, *args, **kwargs):
        if not cls.__instance:
            cls.__instance = super(Logger, cls).__new__(cls, *args, **kwargs)

        return cls.__instance

    def __init__(self):
        self.log = logger
        # 清空文件内容
        # with open(LOG_FILE, 'r+') as file:
        #     file.truncate(0)
        # 写日志
        logger.add(LOG_FILE)

    def info(self, msg):
        return self.log.info(msg)

    def debug(self, msg):
        return self.log.debug(msg)

    def warning(self, msg):
        return self.log.warning(msg)

    def error(self, msg):
        return self.log.error(msg)


loggers = Logger()
