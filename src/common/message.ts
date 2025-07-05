import axios from "axios";
import logger from "./logger";
import fs from "fs";
import path from "path";

// 读取pushkey文件
let pushkeyTxt = "";
if (fs.existsSync("/app/config/pushkey.txt")) {
  pushkeyTxt = fs.readFileSync("/app/config/pushkey.txt").toString();
}
const sendKey = process.env["SERVERPUSHKEY"] || pushkeyTxt;

async function sendMessage() {
  const url = `https://api2.pushdeer.com/message/push`;
  const data = {
    pushkey: sendKey,
    type: 'text',
    text: `【斗鱼荧光棒-完成】`,
    desp: fs.readFileSync(path.join(__dirname, "..", "..", "douyu.log"), "utf-8")
  };
  if (data.desp) {
    logger.info("------执行推送------");
    await axios({
      method: "post",
      url,
      data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    logger.info("------推送成功------");
  } else {
    await axios({
      method: "post",
      url,
      data: {
        text: "斗鱼荧光棒-错误",
        desp: "执行出现问题,日志为空"
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
  }
}

export default sendMessage;
