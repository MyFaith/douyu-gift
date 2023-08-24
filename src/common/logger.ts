import log4js from "log4js";
import fs from "fs";
import path from "path";

fs.writeFileSync(path.join(__dirname, "..", "..", "douyu.log"), "");

const logger = log4js.getLogger();
logger.level = "debug";

log4js.configure({
  appenders: {
    console: {
      type: "console"
    },
    file: {
      type: "file",
      filename: "douyu.log",
      category: "default"
    }
  },
  categories: {
    default: {
      appenders: ["console", "file"],
      level: "debug"
    }
  }
});

export default logger;
